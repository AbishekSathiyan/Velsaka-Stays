const crypto = require("node:crypto");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const { getRazorpay } = require("../config/razorpay");

const getAuthenticatedUserId = (req) => {
  const userId = req.user?.userId;

  return userId && mongoose.isValidObjectId(userId) ? userId : null;
};

const isValidDateString = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const dateToUtc = (value) => new Date(`${value}T00:00:00.000Z`);

const createPaymentOrder = async (req, res) => {
  try {
    // 1. Validate the logged-in user
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to book a hotel.",
      });
    }

    // 2. Read booking details
    const { hotelId, customer, checkIn, checkOut, guests } = req.body;

    if (!mongoose.isValidObjectId(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID.",
      });
    }

    const name = typeof customer?.name === "string" ? customer.name.trim() : "";

    const email =
      typeof customer?.email === "string"
        ? customer.email.trim().toLowerCase()
        : "";

    const phone = String(customer?.phone || "").replace(/\D/g, "");
    const guestCount = Number(guests);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid customer name.",
      });
    }

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Indian mobile number.",
      });
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      return res.status(400).json({
        success: false,
        message: "Guests must be between 1 and 20.",
      });
    }

    if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date.",
      });
    }

    const start = dateToUtc(checkIn);
    const end = dateToUtc(checkOut);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past.",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    const nights = Math.round(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (nights < 1 || nights > 365) {
      return res.status(400).json({
        success: false,
        message: "Stay duration must be between 1 and 365 nights.",
      });
    }

    // 3. Get the hotel and calculate the price on the server
    const hotel = await Hotel.findOne({
      _id: hotelId,
      isActive: true,
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found or unavailable.",
      });
    }

    const pricePerNight = Number(hotel.pricePerNight);

    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Hotel price is invalid.",
      });
    }

    const amountInPaise = Math.round(pricePerNight * nights * 100);

    if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate a valid payment amount.",
      });
    }

    // Store the amount in rupees, matching Booking.totalPrice
    const totalPrice = amountInPaise / 100;

    // 4. Create the Razorpay order
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `stay_${Date.now()}`,
      notes: {
        userId: String(userId),
        hotelId: String(hotel._id),
        checkIn,
        checkOut,
      },
    });

    // 5. Save booking using the actual Booking schema fields
    let booking;

    try {
      booking = await Booking.create({
        user: userId,
        hotel: hotel._id,
        checkIn: start,
        checkOut: end,
        guests: guestCount,
        rooms: 1,
        totalPrice,
        currency: "INR",
        razorpayOrderId: order.id,
        paymentStatus: "pending",
        status: "pending",
      });
    } catch (error) {
      // Avoid leaving an unused order where possible.
      // Razorpay orders cannot generally be deleted; the order
      // simply remains unpaid if booking creation fails.
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Payment order created.",
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create payment order.",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    // 1. Validate the logged-in user
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to verify payment.",
      });
    }

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(bookingId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Required payment verification details are missing.",
      });
    }

    // 2. Find only a booking owned by this user
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.paymentStatus === "paid") {
      if (booking.razorpayPaymentId === razorpay_payment_id) {
        return res.json({
          success: true,
          message: "Payment already verified.",
          bookingId: booking._id,
          paymentId: booking.razorpayPaymentId,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This booking has already been paid.",
      });
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment order does not match this booking.",
      });
    }

    // 3. Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error("Razorpay secret is missing from server environment.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // 4. Verify payment details directly with Razorpay
    const razorpay = getRazorpay();

    let payment = await razorpay.payments.fetch(razorpay_payment_id);

    const expectedAmount = Math.round(booking.totalPrice * 100);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== expectedAmount ||
      payment.currency !== booking.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the booking.",
      });
    }

    // 5. Capture payment if the payment is authorized
    if (payment.status === "authorized") {
      payment = await razorpay.payments.capture(
        razorpay_payment_id,
        payment.amount,
        payment.currency,
      );
    }

    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message: "Payment has not been captured yet.",
      });
    }

    // 6. Update fields that exist in the Booking model
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed.",
      bookingId: booking._id,
      paymentId: booking.razorpayPaymentId,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Could not verify payment. Check payment status before retrying.",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};
