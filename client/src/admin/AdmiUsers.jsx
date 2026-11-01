
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  RefreshCw,
  AlertCircle,
  Search,
  ShieldCheck,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Filter,
  ArrowUpRight,
  UserCheck,
  UsersRound,
} from "lucide-react";

import apiClient from "../api/apiClient";

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getAvatarColor = (name = "") => {
  const colors = [
    "bg-blue-50 text-blue-700",
    "bg-purple-50 text-purple-700",
    "bg-emerald-50 text-emerald-700",
    "bg-amber-50 text-amber-700",
    "bg-rose-50 text-rose-700",
    "bg-cyan-50 text-cyan-700",
  ];

  const index = [...name].reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  return colors[index % colors.length];
};

const getRoleStyle = (role) => {
  if (role?.toLowerCase() === "admin") {
    return "bg-amber-50 text-amber-700 ring-amber-600/10";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // FETCH CUSTOMERS
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/admin/customers");

      const data = response.data;

      const customerList = Array.isArray(data)
        ? data
        : Array.isArray(data?.customers)
          ? data.customers
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setCustomers(customerList);
    } catch (err) {
      console.error("CUSTOMERS FETCH ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // CUSTOMER STATISTICS
  const stats = useMemo(() => {
    const admins = customers.filter(
      (customer) => customer.role?.toLowerCase() === "admin"
    ).length;

    const regularUsers = customers.filter(
      (customer) => customer.role?.toLowerCase() !== "admin"
    ).length;

    const withPhone = customers.filter(
      (customer) => customer.phone?.trim()
    ).length;

    return {
      total: customers.length,
      admins,
      regularUsers,
      withPhone,
    };
  }, [customers]);

  // SEARCH AND FILTER
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const name = customer.name || "";
      const email = customer.email || "";
      const phone = customer.phone || "";

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" ||
        customer.role?.toLowerCase() === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [customers, search, roleFilter]);

  const statCards = [
    {
      title: "Total Customers",
      value: stats.total,
      description: "Registered accounts",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Regular Users",
      value: stats.regularUsers,
      description: "Customer accounts",
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Administrators",
      value: stats.admins,
      description: "Platform administrators",
      icon: ShieldCheck,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Phone Available",
      value: stats.withPhone,
      description: "Customers with contact numbers",
      icon: Phone,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen space-y-7 bg-slate-50/50">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Customers
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage registered VELSAKA STAYS accounts.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Customers
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={21} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 transition group-hover:text-amber-500"
                />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {loading
                  ? "..."
                  : stat.value.toLocaleString("en-IN")}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* CUSTOMER TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Customers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading customer records..."
                : `${filteredCustomers.length} of ${customers.length} customers displayed`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* SEARCH */}
            <div className="relative min-w-0 sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
            </div>

            {/* ROLE FILTER */}
            <div className="relative sm:w-40">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="all">All Roles</option>
                <option value="user">Customers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle
                size={19}
                className="shrink-0 text-red-600"
              />

              <p className="text-sm text-red-700">{error}</p>
            </div>

            <button
              onClick={fetchCustomers}
              className="text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? null : filteredCustomers.length === 0 ? (
          /* EMPTY STATE */
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound size={30} />
            </div>

            <h3 className="mt-5 font-bold text-slate-800">
              {customers.length === 0
                ? "No customers found"
                : "No matching customers"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {customers.length === 0
                ? "Registered users will appear here."
                : "Try changing your search or role filter."}
            </p>

            {(search || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
                className="mt-5 text-sm font-semibold text-amber-700 hover:text-amber-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* CUSTOMER DATA TABLE */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4">Account Role</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="transition hover:bg-slate-50/80"
                  >
                    {/* CUSTOMER */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAvatarColor(
                            customer.name
                          )}`}
                        >
                          {getInitials(customer.name)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {customer.name || "Unnamed Customer"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {customer._id?.slice(-8) || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span>
                          {customer.email || "Not provided"}
                        </span>
                      </div>
                    </td>

                    {/* PHONE */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span>
                          {customer.phone || "Not provided"}
                        </span>
                      </div>
                    </td>

                    {/* REGISTRATION DATE */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        {formatDate(customer.createdAt)}
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${getRoleStyle(
                          customer.role
                        )}`}
                      >
                        {customer.role === "admin" ? (
                          <ShieldCheck size={13} />
                        ) : (
                          <UserRound size={13} />
                        )}

                        {customer.role || "user"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        {!loading && !error && customers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <p className="text-xs text-slate-500">
              Showing {filteredCustomers.length} of {customers.length} accounts
            </p>

            <p className="text-xs font-medium text-slate-500">
              VELSAKA STAYS · Customer Management
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM INFORMATION */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <ShieldCheck
          size={19}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Customer account security
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Customer records are displayed from your authenticated
            administration API. Role changes and account deletion
            are not enabled on this page.
          </p>
        </div>
      </div>
    </div>
  );
}
