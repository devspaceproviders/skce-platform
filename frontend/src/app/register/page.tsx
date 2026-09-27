"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ChevronDown,
  BookOpen,
  Package,
  Check,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const DEVICE_OPTIONS = [
  "Smartphone",
  "Laptop",
  "Desktop",
  "Tablet",
];

const INTERNET_OPTIONS = [
  "Wi-Fi",
  "Mobile Data",
  "Both",
];

const CLASS_APP_OPTIONS = [
  "Google Meet",
  "Zoom",
  "WhatsApp",
  "Other",
];

const REFERRAL_SOURCE_OPTIONS = [
  "WhatsApp",
  "YouTube",
  "Facebook / Instagram",
  "Advertisement",
  "Friend / Student / Relative",
  "Other",
];

type CourseOption = {
  id?: number;
  slug?: string;
  title?: string;
};

type PackageOption = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  isActive: boolean;
  courses?: CourseOption[];
};

type PackagesResponse = {
  success: boolean;
  message: string;
  data: PackageOption[];
};

type RegistrationIntentResponse = {
  success: boolean;
  message: string;
  data?: {
    registrationIntentId: number;

    package: {
      id: number;
      slug: string;
      title: string;
      price: number;
    };

    course: {
      id: number;
      slug: string;
      title: string;
    } | null;

    status?: string;
  };
};

type RegistrationFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;

  dateOfBirth: string;
  gender: string;
  genderOther: string;

  qualification: string;
  organization: string;

  guardianName: string;
  guardianRelationship: string;
  guardianRelationshipOther: string;
  guardianMobile: string;
  guardianWhatsapp: string;
  guardianEmail: string;

  deviceTypes: string;
  internetFacility: string;

  preferredClassApp: string;
  preferredClassAppOther: string;

  address: string;
  city: string;
  pin: string;
  state: string;

  referralSource: string;
  referralSourceOther: string;
  referralName: string;
  referralMobile: string;

  referralId: string;

  packageSlug: string;
};

const INITIAL_FORM: RegistrationFormState = {
  name: "",
  email: "",
  phone: "",
  password: "",

  dateOfBirth: "",
  gender: "",
  genderOther: "",

  qualification: "",
  organization: "",

  guardianName: "",
  guardianRelationship: "",
  guardianRelationshipOther: "",
  guardianMobile: "",
  guardianWhatsapp: "",
  guardianEmail: "",

  deviceTypes: "",
  internetFacility: "",

  preferredClassApp: "",
  preferredClassAppOther: "",

  address: "",
  city: "",
  pin: "",
  state: "",

  referralSource: "",
  referralSourceOther: "",
  referralName: "",
  referralMobile: "",

  referralId: "",

  packageSlug: "",
};

function RegisterForm() {
  const searchParams = useSearchParams();

  const urlPackageSlug =
    searchParams.get("package") || "";

  const urlCourseSlug =
    searchParams.get("course") || "";

  const [form, setForm] =
    useState<RegistrationFormState>(
      INITIAL_FORM
    );

  const [packages, setPackages] =
    useState<PackageOption[]>([]);

  const [selectedCourse, setSelectedCourse] =
    useState("");

  const [packagesLoading, setPackagesLoading] =
    useState(true);

  const [packagesError, setPackagesError] =
    useState("");

  const [agreed, setAgreed] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /*
   * ============================================================
   * LOAD PACKAGES
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      try {
        setPackagesLoading(true);
        setPackagesError("");

        const response = await fetch(
          `${API_URL}/packages`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load packages (${response.status})`
          );
        }

        const json: PackagesResponse =
          await response.json();

        if (
          !json.success ||
          !Array.isArray(json.data)
        ) {
          throw new Error(
            "Invalid package response"
          );
        }

        if (cancelled) {
          return;
        }

        const activePackages =
          json.data.filter(
            (pkg) => pkg.isActive
          );

        setPackages(activePackages);

        /*
         * Select package from URL when available.
         */

        const packageFromUrl =
          activePackages.find(
            (pkg) =>
              pkg.slug === urlPackageSlug
          );

        if (packageFromUrl) {
          setForm((current) => ({
            ...current,
            packageSlug:
              packageFromUrl.slug,
          }));

          /*
           * Select course only when that course
           * actually belongs to the selected package.
           */

          const courseFromUrl =
            packageFromUrl.courses?.find(
              (course) =>
                course.slug ===
                urlCourseSlug
            );

          if (courseFromUrl?.slug) {
            setSelectedCourse(
              courseFromUrl.slug
            );
          } else {
            setSelectedCourse("");
          }
        } else {
          setSelectedCourse("");
        }
      } catch (err) {
        console.error(
          "Package loading error:",
          err
        );

        if (!cancelled) {
          setPackagesError(
            "Unable to load learning packages. Please refresh the page and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setPackagesLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, [
    urlPackageSlug,
    urlCourseSlug,
  ]);

  /*
   * ============================================================
   * SELECTED PACKAGE
   * ============================================================
   */

  const selectedPackage =
    packages.find(
      (pkg) =>
        pkg.slug === form.packageSlug
    );

  /*
   * ============================================================
   * SELECTED COURSE
   * ============================================================
   */

  const selectedCourseData =
    selectedPackage?.courses?.find(
      (course) =>
        course.slug === selectedCourse
    );

  /*
   * ============================================================
   * UPDATE FORM
   * ============================================================
   */

  const updateForm = (
    field: keyof RegistrationFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
   * ============================================================
   * CHANGE PACKAGE
   * ============================================================
   */

  const handlePackageChange = (
    packageSlug: string
  ) => {
    updateForm(
      "packageSlug",
      packageSlug
    );

    /*
     * Reset course when package changes.
     * The user can select a course from the
     * new package.
     */

    setSelectedCourse("");
  };

  /*
   * ============================================================
   * DEVICE SELECTION
   * ============================================================
   */

  const toggleDevice = (
    device: string
  ) => {
    const currentDevices =
      form.deviceTypes
        ? form.deviceTypes
            .split(",")
            .map(
              (item) => item.trim()
            )
            .filter(Boolean)
        : [];

    const alreadySelected =
      currentDevices.includes(
        device
      );

    const updatedDevices =
      alreadySelected
        ? currentDevices.filter(
            (item) =>
              item !== device
          )
        : [
            ...currentDevices,
            device,
          ];

    updateForm(
      "deviceTypes",
      updatedDevices.join(",")
    );
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setError("");

    /*
     * ----------------------------------------------------------
     * PACKAGE
     * ----------------------------------------------------------
     */

    if (!selectedPackage) {
      setError(
        "Please select a package."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * ACCOUNT
     * ----------------------------------------------------------
     */

    if (
      form.name.trim().length < 2
    ) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (
      !form.email.includes("@")
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      form.phone
        .replace(/\D/g, "")
        .length < 10
    ) {
      setError(
        "Please enter a valid mobile number."
      );
      return;
    }

    if (
      form.password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * STUDENT
     * ----------------------------------------------------------
     */

    if (!form.dateOfBirth) {
      setError(
        "Please enter your date of birth."
      );
      return;
    }

    if (!form.gender) {
      setError(
        "Please select your gender."
      );
      return;
    }

    if (
      form.gender === "Other" &&
      !form.genderOther.trim()
    ) {
      setError(
        "Please specify your gender."
      );
      return;
    }

    if (
      !form.qualification.trim()
    ) {
      setError(
        "Please enter your class / qualification."
      );
      return;
    }

    if (
      !form.organization.trim()
    ) {
      setError(
        "Please enter your school / college / organization."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * GUARDIAN
     * ----------------------------------------------------------
     */

    if (
      !form.guardianName.trim()
    ) {
      setError(
        "Please enter the parent / guardian name."
      );
      return;
    }

    if (
      !form.guardianRelationship
    ) {
      setError(
        "Please select the relationship."
      );
      return;
    }

    if (
      form.guardianRelationship ===
        "Other" &&
      !form.guardianRelationshipOther.trim()
    ) {
      setError(
        "Please specify the relationship."
      );
      return;
    }

    if (
      form.guardianMobile
        .replace(/\D/g, "")
        .length < 10
    ) {
      setError(
        "Please enter a valid guardian mobile number."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * ONLINE LEARNING
     * ----------------------------------------------------------
     */

    if (!form.deviceTypes) {
      setError(
        "Please select at least one device."
      );
      return;
    }

    if (
      !form.internetFacility
    ) {
      setError(
        "Please select your internet facility."
      );
      return;
    }

    if (
      !form.preferredClassApp
    ) {
      setError(
        "Please select your preferred class app."
      );
      return;
    }

    if (
      form.preferredClassApp ===
        "Other" &&
      !form.preferredClassAppOther.trim()
    ) {
      setError(
        "Please specify the online class app."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * ADDRESS
     * ----------------------------------------------------------
     */

    if (
      form.address.trim().length < 5
    ) {
      setError(
        "Please enter your complete address."
      );
      return;
    }

    if (!form.city.trim()) {
      setError(
        "Please enter your city."
      );
      return;
    }

    if (!form.pin.trim()) {
      setError(
        "Please enter your PIN code."
      );
      return;
    }

    if (!form.state) {
      setError(
        "Please select your state."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * REFERRAL
     * ----------------------------------------------------------
     */

    if (
      !form.referralSource
    ) {
      setError(
        "Please select how you heard about SKCE."
      );
      return;
    }

    if (
      form.referralSource ===
        "Other" &&
      !form.referralSourceOther.trim()
    ) {
      setError(
        "Please specify how you heard about SKCE."
      );
      return;
    }

    /*
     * ----------------------------------------------------------
     * DECLARATION
     * ----------------------------------------------------------
     */

    if (!agreed) {
      setError(
        "Please agree to the User Agreement and Privacy Policy."
      );
      return;
    }

    /*
     * ==========================================================
     * FINAL VALUES
     * ==========================================================
     */

    const finalGender =
      form.gender === "Other"
        ? form.genderOther.trim()
        : form.gender;

    const finalGuardianRelationship =
      form.guardianRelationship ===
      "Other"
        ? form.guardianRelationshipOther.trim()
        : form.guardianRelationship;

    const finalPreferredClassApp =
      form.preferredClassApp ===
      "Other"
        ? form.preferredClassAppOther.trim()
        : form.preferredClassApp;

    const finalReferralSource =
      form.referralSource ===
      "Other"
        ? form.referralSourceOther.trim()
        : form.referralSource;

    setLoading(true);

    try {
      /*
       * ========================================================
       * CREATE REGISTRATION INTENT
       * ========================================================
       */

      const response = await fetch(
        `${API_URL}/payments/registration-intent`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            /*
             * Account
             */

            name:
              form.name.trim(),

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            password:
              form.password,

            /*
             * Student
             */

            dateOfBirth:
              form.dateOfBirth,

            gender:
              finalGender,

            qualification:
              form.qualification.trim(),

            organization:
              form.organization.trim(),

            /*
             * Guardian
             */

            guardianName:
              form.guardianName.trim(),

            guardianRelationship:
              finalGuardianRelationship,

            guardianMobile:
              form.guardianMobile.trim(),

            guardianWhatsapp:
              form.guardianWhatsapp.trim() ||
              undefined,

            guardianEmail:
              form.guardianEmail.trim() ||
              undefined,

            /*
             * Online facilities
             */

            deviceTypes:
              form.deviceTypes,

            internetFacility:
              form.internetFacility,

            preferredClassApp:
              finalPreferredClassApp,

            /*
             * Address
             */

            address:
              form.address.trim(),

            city:
              form.city.trim(),

            pin:
              form.pin.trim(),

            state:
              form.state,

            /*
             * Referral
             */

            referralSource:
              finalReferralSource,

            referralName:
              form.referralName.trim() ||
              undefined,

            referralMobile:
              form.referralMobile.trim() ||
              undefined,

            referralId:
              form.referralId.trim() ||
              undefined,

            /*
             * Package / Course
             */

            packageSlug:
              selectedPackage.slug,

            courseSlug:
              selectedCourse ||
              undefined,

            /*
             * Declaration
             */

            declarationAccepted:
              agreed,
          }),
        }
      );

      const json: RegistrationIntentResponse =
        await response.json();

      if (
        !response.ok ||
        !json.success ||
        !json.data
      ) {
        throw new Error(
          json.message ||
            "Unable to create registration."
        );
      }

      /*
       * ========================================================
       * STORE PAYMENT SESSION DATA
       * ========================================================
       *
       * Never store the password here.
       * ========================================================
       */

      sessionStorage.setItem(
        "skce_registration",
        JSON.stringify({
          registrationIntentId:
            json.data.registrationIntentId,

          name:
            form.name.trim(),

          email:
            form.email.trim(),

          phone:
            form.phone.trim(),

          state:
            form.state,

          referralId:
            form.referralId.trim() ||
            null,

          packageSlug:
            json.data.package.slug,

          packageTitle:
            json.data.package.title,

          amount:
            json.data.package.price,

          courseSlug:
            json.data.course?.slug ||
            null,

          courseTitle:
            json.data.course?.title ||
            null,
        })
      );

      /*
       * ========================================================
       * GO TO PAYMENT
       * ========================================================
       */

      window.location.href =
        "/payment";
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue with registration."
      );

      setLoading(false);
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="border-b border-slate-100 px-6 py-8 text-center sm:px-10">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <BookOpen
                size={24}
                className="text-orange-500"
              />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#173B67]">
              Registration
            </h1>

            <p className="mt-3 text-base text-slate-600">
              Complete your application to continue to payment.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-orange-500 hover:underline"
              >
                Login
              </Link>
            </p>

          </div>

          {/* ================================================== */}
          {/* FORM */}
          {/* ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="px-6 py-8 sm:px-10 sm:py-10"
          >

            {/* ==================================================
                PACKAGE
            ================================================== */}

            <div>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#173B67]">
                  Application Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter your registration and course details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Package */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Choose Package
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      required
                      value={
                        form.packageSlug
                      }
                      disabled={
                        packagesLoading
                      }
                      onChange={(e) =>
                        handlePackageChange(
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                    >
                      <option value="">
                        {packagesLoading
                          ? "Loading Packages..."
                          : "Select Package"}
                      </option>

                      {packages.map(
                        (pkg) => (
                          <option
                            key={pkg.id}
                            value={pkg.slug}
                          >
                            {pkg.title} — ₹
                            {pkg.price.toLocaleString(
                              "en-IN"
                            )}
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Course */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Course Interested In
                  </label>

                  <div className="relative">
                    <select
                      value={
                        selectedCourse
                      }
                      disabled={
                        !selectedPackage
                      }
                      onChange={(e) =>
                        setSelectedCourse(
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                    >
                      <option value="">
                        No specific course
                      </option>

                      {selectedPackage?.courses?.map(
                        (course) => (
                          <option
                            key={
                              course.id ??
                              course.slug
                            }
                            value={
                              course.slug ||
                              ""
                            }
                          >
                            {course.title ||
                              course.slug}
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Student Name *
                  </label>

                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* DOB */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Date of Birth *
                  </label>

                  <input
                    required
                    type="date"
                    value={
                      form.dateOfBirth
                    }
                    onChange={(e) =>
                      updateForm(
                        "dateOfBirth",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Gender */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Gender *
                  </label>

                  <div className="relative">
                    <select
                      required
                      value={form.gender}
                      onChange={(e) =>
                        updateForm(
                          "gender",
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">
                        Select Gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {form.gender ===
                    "Other" && (
                    <input
                      required
                      type="text"
                      value={
                        form.genderOther
                      }
                      onChange={(e) =>
                        updateForm(
                          "genderOther",
                          e.target.value
                        )
                      }
                      placeholder="Please specify"
                      className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  )}
                </div>

                {/* Qualification */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Class / Qualification *
                  </label>

                  <input
                    required
                    type="text"
                    value={
                      form.qualification
                    }
                    onChange={(e) =>
                      updateForm(
                        "qualification",
                        e.target.value
                      )
                    }
                    placeholder="Example: Class 10 / B.Tech"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Organization */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    School / College / Organization *
                  </label>

                  <input
                    required
                    type="text"
                    value={
                      form.organization
                    }
                    onChange={(e) =>
                      updateForm(
                        "organization",
                        e.target.value
                      )
                    }
                    placeholder="Enter organization"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Phone */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Mobile *
                  </label>

                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      updateForm(
                        "phone",
                        e.target.value
                      )
                    }
                    placeholder="Enter mobile number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Email *
                  </label>

                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      updateForm(
                        "email",
                        e.target.value
                      )
                    }
                    placeholder="Enter email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Password */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Password *
                  </label>

                  <div className="relative">

                    <input
                      required
                      minLength={8}
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        form.password
                      }
                      onChange={(e) =>
                        updateForm(
                          "password",
                          e.target.value
                        )
                      }
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-orange-500"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={19}
                        />
                      ) : (
                        <Eye
                          size={19}
                        />
                      )}
                    </button>

                  </div>
                </div>

                {/* Referral ID */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Referral ID
                  </label>

                  <input
                    type="text"
                    value={
                      form.referralId
                    }
                    onChange={(e) =>
                      updateForm(
                        "referralId",
                        e.target.value
                      )
                    }
                    placeholder="Optional referral ID"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

              </div>
            </div>

            {/* ==================================================
                SELECTED PACKAGE
            ================================================== */}

            {selectedPackage && (
              <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Package size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                        Selected Package
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#102A43]">
                        {
                          selectedPackage.title
                        }
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {
                          selectedPackage
                            .courses
                            ?.length ?? 0
                        }{" "}
                        learning areas
                      </p>
                    </div>

                  </div>

                  <div className="text-left sm:text-right">

                    <p className="text-xs text-slate-500">
                      Package Price
                    </p>

                    <p className="text-2xl font-extrabold text-orange-600">
                      ₹
                      {selectedPackage.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </div>
                </div>

                {selectedCourseData?.title && (
                  <div className="mt-4 border-t border-orange-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                      Course Interested In
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#102A43]">
                      {
                        selectedCourseData.title
                      }
                    </p>
                  </div>
                )}

                {selectedPackage.courses &&
                  selectedPackage.courses.length >
                    0 && (
                    <div className="mt-5 border-t border-orange-100 pt-4">

                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-orange-600">
                        Included Courses
                      </p>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                        {selectedPackage.courses.map(
                          (
                            course,
                            index
                          ) => (
                            <div
                              key={
                                course.id ??
                                course.slug ??
                                index
                              }
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                <Check
                                  size={11}
                                  strokeWidth={3}
                                />
                              </span>

                              <span>
                                {
                                  course.title ||
                                    course.slug
                                }
                              </span>
                            </div>
                          )
                        )}

                      </div>
                    </div>
                  )}

              </div>
            )}

            {/* ==================================================
                GUARDIAN
            ================================================== */}

            <div className="mt-10">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-[#173B67]">
                  Parent / Guardian Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Provide your parent or guardian information.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Guardian Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Parent / Guardian Name *
                  </label>

                  <input
                    required
                    type="text"
                    value={
                      form.guardianName
                    }
                    onChange={(e) =>
                      updateForm(
                        "guardianName",
                        e.target.value
                      )
                    }
                    placeholder="Enter guardian name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Relationship */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Relationship *
                  </label>

                  <div className="relative">
                    <select
                      required
                      value={
                        form.guardianRelationship
                      }
                      onChange={(e) =>
                        updateForm(
                          "guardianRelationship",
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">
                        Select Relationship
                      </option>

                      <option value="Father">
                        Father
                      </option>

                      <option value="Mother">
                        Mother
                      </option>

                      <option value="Guardian">
                        Guardian
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {form.guardianRelationship ===
                    "Other" && (
                    <input
                      required
                      type="text"
                      value={
                        form.guardianRelationshipOther
                      }
                      onChange={(e) =>
                        updateForm(
                          "guardianRelationshipOther",
                          e.target.value
                        )
                      }
                      placeholder="Please specify relationship"
                      className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  )}
                </div>

                {/* Guardian Mobile */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Mobile *
                  </label>

                  <input
                    required
                    type="tel"
                    value={
                      form.guardianMobile
                    }
                    onChange={(e) =>
                      updateForm(
                        "guardianMobile",
                        e.target.value
                      )
                    }
                    placeholder="Guardian mobile number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Guardian WhatsApp */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    WhatsApp Number
                  </label>

                  <input
                    type="tel"
                    value={
                      form.guardianWhatsapp
                    }
                    onChange={(e) =>
                      updateForm(
                        "guardianWhatsapp",
                        e.target.value
                      )
                    }
                    placeholder="WhatsApp number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Guardian Email */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Email ID
                  </label>

                  <input
                    type="email"
                    value={
                      form.guardianEmail
                    }
                    onChange={(e) =>
                      updateForm(
                        "guardianEmail",
                        e.target.value
                      )
                    }
                    placeholder="Guardian email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

              </div>
            </div>

            {/* ==================================================
                ONLINE LEARNING
            ================================================== */}

            <div className="mt-10">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-[#173B67]">
                  Online Learning Facilities
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the facilities available for your online classes.
                </p>

              </div>

              {/* Devices */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-[#102A43]">
                  Available Device(s) *
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  {DEVICE_OPTIONS.map(
                    (device) => {
                      const checked =
                        form.deviceTypes
                          .split(",")
                          .map(
                            (item) =>
                              item.trim()
                          )
                          .includes(
                            device
                          );

                      return (
                        <label
                          key={device}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                            checked
                              ? "border-orange-300 bg-orange-50 text-[#102A43]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleDevice(
                                device
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                          />

                          <span>
                            {device}
                          </span>

                        </label>
                      );
                    }
                  )}

                </div>

              </div>

              {/* Internet */}

              <div className="mt-6">

                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Internet Facility *
                </label>

                <div className="relative">

                  <select
                    required
                    value={
                      form.internetFacility
                    }
                    onChange={(e) =>
                      updateForm(
                        "internetFacility",
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >

                    <option value="">
                      Select Internet Facility
                    </option>

                    {INTERNET_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

              {/* Preferred App */}

              <div className="mt-6">

                <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                  Preferred Online Class App *
                </label>

                <div className="relative">

                  <select
                    required
                    value={
                      form.preferredClassApp
                    }
                    onChange={(e) =>
                      updateForm(
                        "preferredClassApp",
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >

                    <option value="">
                      Select Class App
                    </option>

                    {CLASS_APP_OPTIONS.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

                {form.preferredClassApp ===
                  "Other" && (
                  <input
                    required
                    type="text"
                    value={
                      form.preferredClassAppOther
                    }
                    onChange={(e) =>
                      updateForm(
                        "preferredClassAppOther",
                        e.target.value
                      )
                    }
                    placeholder="Please specify the online class app"
                    className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                )}

              </div>

            </div>

            {/* ==================================================
                ADDRESS
            ================================================== */}

            <div className="mt-10">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-[#173B67]">
                  Address
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Address */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Address *
                  </label>

                  <textarea
                    required
                    rows={3}
                    value={form.address}
                    onChange={(e) =>
                      updateForm(
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="Enter complete address"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

                {/* City */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    City *
                  </label>

                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      updateForm(
                        "city",
                        e.target.value
                      )
                    }
                    placeholder="Enter city"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

                {/* PIN */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    PIN Code *
                  </label>

                  <input
                    required
                    type="text"
                    value={form.pin}
                    onChange={(e) =>
                      updateForm(
                        "pin",
                        e.target.value
                      )
                    }
                    placeholder="Enter PIN"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

                {/* State */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    State *
                  </label>

                  <div className="relative">

                    <select
                      required
                      value={form.state}
                      onChange={(e) =>
                        updateForm(
                          "state",
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >

                      <option value="">
                        Select State
                      </option>

                      {STATES.map(
                        (state) => (
                          <option
                            key={state}
                            value={state}
                          >
                            {state}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                REFERRAL
            ================================================== */}

            <div className="mt-10">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-[#173B67]">
                  Referral / Source
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Source */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    How did you hear about SKCE? *
                  </label>

                  <div className="relative">

                    <select
                      required
                      value={
                        form.referralSource
                      }
                      onChange={(e) =>
                        updateForm(
                          "referralSource",
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >

                      <option value="">
                        Select Source
                      </option>

                      {REFERRAL_SOURCE_OPTIONS.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {option}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                  {form.referralSource ===
                    "Other" && (
                    <input
                      required
                      type="text"
                      value={
                        form.referralSourceOther
                      }
                      onChange={(e) =>
                        updateForm(
                          "referralSourceOther",
                          e.target.value
                        )
                      }
                      placeholder="Please specify"
                      className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  )}

                </div>

                {/* Referral Name */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Referral Name
                  </label>

                  <input
                    type="text"
                    value={
                      form.referralName
                    }
                    onChange={(e) =>
                      updateForm(
                        "referralName",
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

                {/* Referral Mobile */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#102A43]">
                    Referral Mobile
                  </label>

                  <input
                    type="tel"
                    value={
                      form.referralMobile
                    }
                    onChange={(e) =>
                      updateForm(
                        "referralMobile",
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

              </div>

            </div>

            {/* ==================================================
                DECLARATION
            ================================================== */}

            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) =>
                    setAgreed(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />

                <span className="text-sm leading-relaxed text-slate-600">

                  I agree to the{" "}

                  <Link
                    href="/terms"
                    className="font-semibold text-orange-500 hover:underline"
                  >
                    User Agreement
                  </Link>

                  {" "}and{" "}

                  <Link
                    href="/privacy-policy"
                    className="font-semibold text-orange-500 hover:underline"
                  >
                    Privacy Policy
                  </Link>

                  .{" "}

                  <span className="text-red-500">
                    *
                  </span>

                </span>

              </label>

            </div>

            {/* Error */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}

            <div className="mt-8 flex justify-center">

              <button
                type="submit"
                disabled={
                  loading ||
                  packagesLoading
                }
                className="min-w-[240px] rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading
                  ? "Creating Registration..."
                  : "Continue to Payment"}
              </button>

            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Your registration details will be securely processed before payment.
            </p>

          </form>
        </div>

      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-screen bg-slate-50 px-5 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Loading registration...
              </p>
            </div>
          </div>
        </section>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}