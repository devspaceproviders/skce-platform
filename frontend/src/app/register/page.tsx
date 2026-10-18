"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Package,
  Pencil,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import FormField from "@/components/FormField";
import PasswordInput, { PasswordStrength } from "@/components/PasswordInput";
import { InlineAlert, useToast } from "@/components/Toast";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  SELECT_CLASS,
  TEXTAREA_CLASS,
  TEXT_LINK,
} from "@/components/formStyles";
import {
  getErrorMessage,
  isNetworkError,
  validateDob,
  validateEmail,
  validateMobile,
  validatePassword,
  validatePersonName,
  validatePin,
  validatePlaceName,
} from "@/components/formValidators";

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
  errors?: Record<string, string[] | undefined>;
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

/* =====================================================================
   STEPS + FIELD MAP
   ===================================================================== */

type FieldKey =
  | keyof RegistrationFormState
  | "confirmPassword"
  | "agreed";

type FieldErrors = Partial<Record<FieldKey, string>>;

const STEPS: {
  key: string;
  label: string;
  fields: FieldKey[];
}[] = [
  {
    key: "package",
    label: "Package",
    fields: ["packageSlug"],
  },
  {
    key: "student",
    label: "Student",
    fields: [
      "name",
      "dateOfBirth",
      "gender",
      "genderOther",
      "qualification",
      "organization",
      "phone",
      "email",
      "password",
      "confirmPassword",
    ],
  },
  {
    key: "guardian",
    label: "Guardian",
    fields: [
      "guardianName",
      "guardianRelationship",
      "guardianRelationshipOther",
      "guardianMobile",
      "guardianWhatsapp",
      "guardianEmail",
    ],
  },
  {
    key: "learning",
    label: "Learning",
    fields: [
      "deviceTypes",
      "internetFacility",
      "preferredClassApp",
      "preferredClassAppOther",
      "address",
      "city",
      "pin",
      "state",
    ],
  },
  {
    key: "finish",
    label: "Finish",
    fields: [
      "referralSource",
      "referralSourceOther",
      "referralName",
      "referralMobile",
      "referralId",
      "agreed",
    ],
  },
];

const LAST_STEP = STEPS.length - 1;

const ALL_FIELDS: FieldKey[] = STEPS.flatMap((step) => step.fields);

// Fields whose characters are checked while the user types.
const LIVE_FIELDS: FieldKey[] = [
  "name",
  "guardianName",
  "city",
  "referralName",
];

const stepOfField = (field: FieldKey) =>
  STEPS.findIndex((step) => step.fields.includes(field));

const withError = (
  current: FieldErrors,
  field: FieldKey,
  message: string
): FieldErrors => {
  const next = { ...current };

  if (message) {
    next[field] = message;
  } else {
    delete next[field];
  }

  return next;
};

const sanitizePhone = (value: string) => value.replace(/[^\d+\s-]/g, "");

const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, 6);

/* =====================================================================
   SMALL PRESENTATION HELPERS
   ===================================================================== */

function SelectBox({
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${props.id}-error` : undefined}
        className={`${SELECT_CLASS} ${error ? INPUT_ERROR_CLASS : ""}`}
      >
        {children}
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-3 text-xl font-bold text-[#173B67]">
        <span
          aria-hidden="true"
          className="h-6 w-1 rounded-full bg-orange-500"
        />
        {title}
      </h2>

      <p className="mt-1 pl-4 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Stepper({
  step,
  maxStep,
  onSelect,
}: {
  step: number;
  maxStep: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      {/* Tablet / desktop */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((item, index) => {
          const done = index < step;
          const current = index === step;
          const reachable = index <= maxStep;

          return (
            <li
              key={item.key}
              className={`flex items-center ${
                index < LAST_STEP ? "flex-1" : ""
              }`}
            >
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(index)}
                aria-current={current ? "step" : undefined}
                className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition duration-300 ${
                    done
                      ? "border-orange-500 bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                      : current
                        ? "sk-step-current border-orange-500 bg-white text-orange-600 shadow-md shadow-orange-500/20"
                        : reachable
                          ? "border-orange-200 bg-white text-orange-400 group-hover:border-orange-400"
                          : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : index + 1}
                </span>

                <span
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    current
                      ? "text-[#173B67]"
                      : reachable
                        ? "text-slate-600 group-hover:text-orange-500"
                        : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>

              {index < LAST_STEP && (
                <span
                  aria-hidden="true"
                  className={`mx-3 h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                    index < step ? "bg-orange-500" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Phone */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#173B67]">
            Step {step + 1} of {STEPS.length}
          </span>

          <span className="font-medium text-orange-500">
            {STEPS[step].label}
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-orange-500 transition-[width] duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-[#173B67]">
          {value || "—"}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <Pencil size={12} />
        Edit
      </button>
    </div>
  );
}

/* =====================================================================
   REGISTER FORM
   ===================================================================== */

function RegisterForm() {
  const searchParams = useSearchParams();
  const { notify, toastContainer } = useToast();

  const urlPackageSlug =
    searchParams.get("package") || "";

  const urlCourseSlug =
    searchParams.get("course") || "";

  const formTopRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] =
    useState<RegistrationFormState>(
      INITIAL_FORM
    );

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [packages, setPackages] =
    useState<PackageOption[]>([]);

  const [selectedCourse, setSelectedCourse] =
    useState("");

  const [packagesLoading, setPackagesLoading] =
    useState(true);

  const [packagesError, setPackagesError] =
    useState("");

  const [packagesReload, setPackagesReload] =
    useState(0);

  const [agreed, setAgreed] =
    useState(false);

  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  const [errors, setErrors] =
    useState<FieldErrors>({});

  const [submitError, setSubmitError] =
    useState<{ title: string; message: string } | null>(null);

  const [loading, setLoading] =
    useState(false);

  /*
   * LOAD PACKAGES
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
            isNetworkError(err)
              ? "We couldn't reach the server to load the packages. Please check your internet connection."
              : "Unable to load learning packages. Please try again."
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
    packagesReload,
  ]);

  /*
   * SELECTED PACKAGE / COURSE
   */

  const selectedPackage =
    packages.find(
      (pkg) =>
        pkg.slug === form.packageSlug
    );

  const selectedCourseData =
    selectedPackage?.courses?.find(
      (course) =>
        course.slug === selectedCourse
    );

  const selectedDevices = form.deviceTypes
    ? form.deviceTypes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  /* =================================================================
     VALIDATION — one rule per field, specific messages
     ================================================================= */

  const validateField = (
    field: FieldKey,
    state: RegistrationFormState = form,
    agreedValue: boolean = agreed,
    confirmValue: string = confirmPassword
  ): string => {
    switch (field) {
      case "packageSlug":
        return state.packageSlug &&
          packages.some((pkg) => pkg.slug === state.packageSlug)
          ? ""
          : "Please choose a package to continue.";

      case "name":
        return validatePersonName(state.name, "your full name");

      case "dateOfBirth":
        return validateDob(state.dateOfBirth);

      case "gender":
        return state.gender ? "" : "Please select your gender.";

      case "genderOther":
        return state.gender === "Other" && !state.genderOther.trim()
          ? "Please specify your gender."
          : "";

      case "qualification": {
        const value = state.qualification.trim();

        if (!value) {
          return "Please enter your class or qualification, for example Class 10 or B.Tech.";
        }

        return value.length < 2
          ? "Please enter at least 2 characters."
          : "";
      }

      case "organization": {
        const value = state.organization.trim();

        if (!value) {
          return "Please enter your school, college or organization.";
        }

        return value.length < 2
          ? "Please enter at least 2 characters."
          : "";
      }

      case "phone":
        return validateMobile(state.phone, true, "mobile number");

      case "email":
        return validateEmail(state.email);

      case "password":
        return validatePassword(state.password);

      case "confirmPassword":
        if (!confirmValue) {
          return "Please re-enter your password.";
        }

        return confirmValue !== state.password
          ? "Passwords don't match. Please re-enter."
          : "";

      case "guardianName":
        return validatePersonName(
          state.guardianName,
          "the parent or guardian's name"
        );

      case "guardianRelationship":
        return state.guardianRelationship
          ? ""
          : "Please select the relationship.";

      case "guardianRelationshipOther":
        return state.guardianRelationship === "Other" &&
          !state.guardianRelationshipOther.trim()
          ? "Please specify the relationship."
          : "";

      case "guardianMobile":
        return validateMobile(
          state.guardianMobile,
          true,
          "guardian's mobile number"
        );

      case "guardianWhatsapp":
        return validateMobile(
          state.guardianWhatsapp,
          false,
          "WhatsApp number"
        );

      case "guardianEmail":
        return validateEmail(state.guardianEmail, false);

      case "deviceTypes":
        return state.deviceTypes
          ? ""
          : "Select at least one device you can use for online classes.";

      case "internetFacility":
        return state.internetFacility
          ? ""
          : "Please select your internet facility.";

      case "preferredClassApp":
        return state.preferredClassApp
          ? ""
          : "Please select your preferred class app.";

      case "preferredClassAppOther":
        return state.preferredClassApp === "Other" &&
          !state.preferredClassAppOther.trim()
          ? "Please specify the online class app."
          : "";

      case "address": {
        const value = state.address.trim();

        if (!value) {
          return "Please enter your complete address.";
        }

        return value.length < 5
          ? "Address looks too short. Please enter your complete address."
          : "";
      }

      case "city":
        return validatePlaceName(state.city, "city");

      case "pin":
        return validatePin(state.pin);

      case "state":
        return state.state ? "" : "Please select your state.";

      case "referralSource":
        return state.referralSource
          ? ""
          : "Please tell us how you heard about SK Computer Education.";

      case "referralSourceOther":
        return state.referralSource === "Other" &&
          !state.referralSourceOther.trim()
          ? "Please specify how you heard about us."
          : "";

      case "referralName":
        return validatePersonName(
          state.referralName,
          "the referrer's name",
          false
        );

      case "referralMobile":
        return validateMobile(
          state.referralMobile,
          false,
          "referrer's mobile number"
        );

      case "agreed":
        return agreedValue
          ? ""
          : "Please accept the User Agreement and Privacy Policy to continue.";

      default:
        return "";
    }
  };

  const clearFields = (
    current: FieldErrors,
    fields: FieldKey[]
  ): FieldErrors => {
    const next = { ...current };

    fields.forEach((field) => {
      delete next[field];
    });

    return next;
  };

  const validateStepFields = (index: number) => {
    const found: FieldErrors = {};
    let first: FieldKey | undefined;

    for (const field of STEPS[index].fields) {
      const message = validateField(field);

      if (message) {
        found[field] = message;

        if (!first) {
          first = field;
        }
      }
    }

    return { found, first };
  };

  /* =================================================================
     HELPERS: focus, step changes, notifications
     ================================================================= */

  const focusField = (field: FieldKey, delay = 80) => {
    window.setTimeout(() => {
      const element = document.getElementById(`reg-${field}`);

      if (element) {
        element.focus({ preventScroll: true });
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, delay);
  };

  const changeStep = (index: number) => {
    setStep(index);

    formTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const notifyInvalid = (found: FieldErrors) => {
    const messages = Object.values(found).filter(
      (message): message is string => Boolean(message)
    );

    const count = messages.length;

    if (count === 0) {
      return;
    }

    notify(
      "warning",
      count > 1
        ? `${count} fields need your attention`
        : "Please check this field",
      count > 1
        ? `${messages[0]} (plus ${count - 1} more below.)`
        : messages[0]
    );
  };

  /* =================================================================
     FIELD HANDLERS
     ================================================================= */

  const handleBlur = (field: FieldKey) => {
    const message = validateField(field);

    setErrors((current) => withError(current, field, message));
  };

  const updateForm = (
    field: keyof RegistrationFormState,
    value: string
  ) => {
    const next: RegistrationFormState = {
      ...form,
      [field]: value,
    };

    setForm(next);
    setSubmitError(null);

    setErrors((current) => {
      let updated = current;

      const revalidate = (target: FieldKey, force = false) => {
        if (force || updated[target]) {
          updated = withError(
            updated,
            target,
            validateField(target, next)
          );
        }
      };

      // Letters-only fields are checked as the user types.
      revalidate(field, LIVE_FIELDS.includes(field) && value.length > 0);

      // Fields that depend on another field.
      if (field === "password") revalidate("confirmPassword");
      if (field === "gender") revalidate("genderOther");
      if (field === "guardianRelationship")
        revalidate("guardianRelationshipOther");
      if (field === "preferredClassApp")
        revalidate("preferredClassAppOther");
      if (field === "referralSource") revalidate("referralSourceOther");

      return updated;
    });
  };

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

  const toggleDevice = (
    device: string
  ) => {
    const alreadySelected =
      selectedDevices.includes(
        device
      );

    const updatedDevices =
      alreadySelected
        ? selectedDevices.filter(
            (item) =>
              item !== device
          )
        : [
            ...selectedDevices,
            device,
          ];

    updateForm(
      "deviceTypes",
      updatedDevices.join(",")
    );
  };

  /* =================================================================
     RENDER HELPERS (functions, not components, so inputs keep focus)
     ================================================================= */

  const inputClass = (field: FieldKey) =>
    `${INPUT_CLASS} ${errors[field] ? INPUT_ERROR_CLASS : ""}`;

  const a11y = (field: FieldKey) => ({
    id: `reg-${field}`,
    "aria-invalid": errors[field] ? (true as const) : undefined,
    "aria-describedby": errors[field] ? `reg-${field}-error` : undefined,
    onBlur: () => handleBlur(field),
  });

  const renderText = (options: {
    field: keyof RegistrationFormState;
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    hint?: string;
    className?: string;
    inputMode?: "text" | "numeric" | "tel" | "email";
    maxLength?: number;
    sanitize?: (value: string) => string;
    min?: string;
    max?: string;
  }) => {
    const {
      field,
      label,
      required,
      type = "text",
      placeholder,
      autoComplete,
      hint,
      className,
      inputMode,
      maxLength,
      sanitize,
      min,
      max,
    } = options;

    return (
      <FormField
        label={label}
        required={required}
        htmlFor={`reg-${field}`}
        error={errors[field]}
        hint={hint}
        className={className}
      >
        <input
          {...a11y(field)}
          type={type}
          value={form[field]}
          onChange={(e) =>
            updateForm(
              field,
              sanitize ? sanitize(e.target.value) : e.target.value
            )
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          min={min}
          max={max}
          className={inputClass(field)}
        />
      </FormField>
    );
  };

  const renderSelect = (options: {
    field: keyof RegistrationFormState;
    label: string;
    required?: boolean;
    placeholder: string;
    values: string[];
    className?: string;
  }) => {
    const { field, label, required, placeholder, values, className } =
      options;

    return (
      <FormField
        label={label}
        required={required}
        htmlFor={`reg-${field}`}
        error={errors[field]}
        className={className}
      >
        <SelectBox
          {...a11y(field)}
          value={form[field]}
          error={errors[field]}
          onChange={(e) => updateForm(field, e.target.value)}
        >
          <option value="">{placeholder}</option>

          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectBox>
      </FormField>
    );
  };

  const renderOther = (
    field: keyof RegistrationFormState,
    placeholder: string
  ) => (
    <FormField
      htmlFor={`reg-${field}`}
      error={errors[field]}
      className="sk-reg-in mt-3"
    >
      <input
        {...a11y(field)}
        type="text"
        value={form[field]}
        onChange={(e) => updateForm(field, e.target.value)}
        placeholder={placeholder}
        className={inputClass(field)}
      />
    </FormField>
  );

  /* =================================================================
     STEP NAVIGATION + SUBMIT
     ================================================================= */

  const handleNext = () => {
    const { found, first } = validateStepFields(step);

    setErrors((current) => ({
      ...clearFields(current, STEPS[step].fields),
      ...found,
    }));

    if (first) {
      notifyInvalid(found);
      focusField(first);
      return;
    }

    const nextStep = Math.min(step + 1, LAST_STEP);

    setMaxStep((current) => Math.max(current, nextStep));
    changeStep(nextStep);
  };

  const handleBack = () => {
    if (step > 0) {
      changeStep(step - 1);
    }
  };

  /*
   * Works out which field a server message is about, so it can
   * be shown next to that field instead of as a vague banner.
   */
  const fieldFromServerMessage = (message: string): FieldKey | null => {
    if (
      /email/i.test(message) &&
      /already|exists|registered|taken|in use/i.test(message)
    ) {
      return "email";
    }

    if (
      /(phone|mobile)/i.test(message) &&
      /already|exists|registered|taken|in use/i.test(message)
    ) {
      return "phone";
    }

    return null;
  };

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    // Enter key on an earlier step = "Continue".
    if (step < LAST_STEP) {
      handleNext();
      return;
    }

    setSubmitError(null);

    /*
     * Re-check every step before sending anything.
     */

    const all: FieldErrors = {};
    let firstStep = -1;
    let firstField: FieldKey | undefined;

    for (let index = 0; index < STEPS.length; index += 1) {
      for (const field of STEPS[index].fields) {
        const message = validateField(field);

        if (message) {
          all[field] = message;

          if (firstStep === -1) {
            firstStep = index;
            firstField = field;
          }
        }
      }
    }

    if (firstStep !== -1 && firstField) {
      setErrors(all);
      notifyInvalid(all);

      if (firstStep !== step) {
        changeStep(firstStep);
      }

      focusField(firstField, firstStep !== step ? 350 : 80);
      return;
    }

    if (!selectedPackage) {
      notify("warning", "Please choose a package to continue.");
      changeStep(0);
      return;
    }

    /*
     * FINAL VALUES
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
       * CREATE REGISTRATION INTENT
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
            /* Account */

            name:
              form.name.trim(),

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            password:
              form.password,

            /* Student */

            dateOfBirth:
              form.dateOfBirth,

            gender:
              finalGender,

            qualification:
              form.qualification.trim(),

            organization:
              form.organization.trim(),

            /* Guardian */

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

            /* Online facilities */

            deviceTypes:
              form.deviceTypes,

            internetFacility:
              form.internetFacility,

            preferredClassApp:
              finalPreferredClassApp,

            /* Address */

            address:
              form.address.trim(),

            city:
              form.city.trim(),

            pin:
              form.pin.trim(),

            state:
              form.state,

            /* Referral */

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

            /* Package / Course */

            packageSlug:
              selectedPackage.slug,

            courseSlug:
              selectedCourse ||
              undefined,

            /* Declaration */

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
        /*
         * If the server tells us which field is wrong,
         * take the user straight to that field.
         */
        const serverErrors: FieldErrors = {};

        for (const [key, messages] of Object.entries(
          json.errors ?? {}
        )) {
          const target = (
            key === "declarationAccepted" ? "agreed" : key
          ) as FieldKey;

          const message = messages?.find(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0
          );

          if (message && ALL_FIELDS.includes(target)) {
            serverErrors[target] = message;
          }
        }

        const serverFields = Object.keys(serverErrors) as FieldKey[];

        if (serverFields.length > 0) {
          const target = serverFields[0];

          setErrors((current) => ({ ...current, ...serverErrors }));
          setMaxStep(LAST_STEP);
          changeStep(stepOfField(target));
          notify(
            "error",
            "Please correct your details",
            serverErrors[target]
          );
          focusField(target, 350);
          setLoading(false);
          return;
        }

        const fieldFromMessage = fieldFromServerMessage(
          json.message || ""
        );

        if (fieldFromMessage) {
          setErrors((current) =>
            withError(current, fieldFromMessage, json.message)
          );
          changeStep(stepOfField(fieldFromMessage));
          notify("error", "Please correct your details", json.message);
          focusField(fieldFromMessage, 350);
          setLoading(false);
          return;
        }

        throw new Error(
          json.message ||
            "Unable to create registration."
        );
      }

      /*
       * STORE PAYMENT SESSION DATA
       * Never store the password here.
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

      notify(
        "success",
        "Details saved",
        "Taking you to the secure payment page...",
        3000
      );

      /*
       * GO TO PAYMENT
       */

      window.setTimeout(() => {
        window.location.href =
          "/payment";
      }, 700);
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      const message = getErrorMessage(
        err,
        "Unable to continue with registration."
      );

      const title = isNetworkError(err)
        ? "Connection problem"
        : "We couldn't complete your registration";

      setSubmitError({ title, message });
      notify("error", title, message);

      setLoading(false);
    }
  };

  /* =================================================================
     RENDER
     ================================================================= */

  const packageIncludes = selectedPackage?.courses ?? [];

  return (
    <>
      {toastContainer}

      <section className="relative isolate overflow-hidden bg-[#EEF3FA] px-5 py-8 sm:px-6 sm:py-12">
        {/* Navy animated banner behind the heading */}
        <div className="sk-reg-band pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] sm:h-[340px]">
          <div className="sk-reg-grid absolute inset-0" />
          <div className="sk-reg-orb sk-reg-orb-a absolute" />
          <div className="sk-reg-orb sk-reg-orb-b absolute" />
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-orange-500 via-blue-500 to-[#0B2A52]" />
        </div>

        <div className="mx-auto max-w-6xl">
          {/* Page heading */}
          <div className="sk-reg-in mb-8 text-center">
            <div className="sk-reg-icon relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/30">
              <BookOpen size={26} className="text-white" />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Registration
            </h1>

            <p className="mt-2 text-base text-blue-100/85">
              Complete your application in a few quick steps.
            </p>

            <p className="mt-2 text-sm text-blue-100/70">
              Already have an account?{" "}
              <Link href="/login" className={TEXT_LINK}>
                Login
              </Link>
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            {/* ===================== FORM CARD ===================== */}
            <div
              ref={formTopRef}
              className="sk-reg-card scroll-mt-24 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-blue-950/15 ring-1 ring-slate-900/5"
            >
              <div className="sk-reg-bar h-1.5 bg-gradient-to-r from-orange-500 via-blue-500 to-[#173B67]" />

              <form
                onSubmit={handleSubmit}
                noValidate
                className="p-6 sm:p-8"
              >
                <Stepper
                  step={step}
                  maxStep={maxStep}
                  onSelect={(index) => {
                    if (index <= maxStep) {
                      changeStep(index);
                    }
                  }}
                />

                {/* ---------------- STEP 1 — PACKAGE ---------------- */}
                {step === 0 && (
                  <div key="step-package" className="sk-reg-in">
                    <StepHeading
                      title="Choose Your Package"
                      subtitle="Pick the learning package you want to join."
                    />

                    {packagesError && (
                      <div className="mb-5">
                        <InlineAlert
                          title="Couldn't load packages"
                          message={packagesError}
                        />

                        <button
                          type="button"
                          onClick={() => setPackagesReload((n) => n + 1)}
                          className={`${BTN_GHOST} mt-3 h-10`}
                        >
                          <RefreshCw size={15} />
                          Try Again
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormField
                        label="Choose Package"
                        required
                        htmlFor="reg-packageSlug"
                        error={errors.packageSlug}
                      >
                        <SelectBox
                          {...a11y("packageSlug")}
                          value={form.packageSlug}
                          disabled={packagesLoading}
                          error={errors.packageSlug}
                          onChange={(e) =>
                            handlePackageChange(e.target.value)
                          }
                        >
                          <option value="">
                            {packagesLoading
                              ? "Loading packages..."
                              : "Select package"}
                          </option>

                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.slug}>
                              {pkg.title} — ₹
                              {pkg.price.toLocaleString("en-IN")}
                            </option>
                          ))}
                        </SelectBox>
                      </FormField>

                      <FormField
                        label="Course Interested In"
                        htmlFor="reg-course"
                        hint="Optional — pick one if you have a favourite."
                      >
                        <SelectBox
                          id="reg-course"
                          value={selectedCourse}
                          disabled={!selectedPackage}
                          onChange={(e) =>
                            setSelectedCourse(e.target.value)
                          }
                        >
                          <option value="">No specific course</option>

                          {selectedPackage?.courses?.map((course) => (
                            <option
                              key={course.id ?? course.slug}
                              value={course.slug || ""}
                            >
                              {course.title || course.slug}
                            </option>
                          ))}
                        </SelectBox>
                      </FormField>
                    </div>

                    {selectedPackage && (
                      <div className="sk-reg-in mt-6 rounded-2xl border border-orange-100 bg-orange-50/70 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                              <Package size={19} />
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                                Selected Package
                              </p>

                              <h3 className="mt-1 text-lg font-bold text-[#173B67]">
                                {selectedPackage.title}
                              </h3>

                              {selectedPackage.description && (
                                <p className="mt-1 text-sm text-slate-600">
                                  {selectedPackage.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-2xl font-bold text-orange-600">
                            ₹{selectedPackage.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {packageIncludes.length > 0 && (
                          <div className="mt-5 border-t border-orange-100 pt-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-orange-600">
                              Included Courses ({packageIncludes.length})
                            </p>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {packageIncludes.map((course, index) => (
                                <div
                                  key={course.id ?? course.slug ?? index}
                                  className="flex items-start gap-2 text-sm text-slate-600"
                                >
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                    <Check size={11} strokeWidth={3} />
                                  </span>

                                  <span>{course.title || course.slug}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- STEP 2 — STUDENT ---------------- */}
                {step === 1 && (
                  <div key="step-student" className="sk-reg-in">
                    <StepHeading
                      title="Student Details"
                      subtitle="Tell us about the student. You'll use the email and password to sign in."
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {renderText({
                        field: "name",
                        label: "Student Name",
                        required: true,
                        placeholder: "Enter your full name",
                        autoComplete: "name",
                        className: "md:col-span-2",
                      })}

                      {renderText({
                        field: "dateOfBirth",
                        label: "Date of Birth",
                        required: true,
                        type: "date",
                        min: "1900-01-01",
                        max: new Date().toISOString().slice(0, 10),
                      })}

                      <div>
                        {renderSelect({
                          field: "gender",
                          label: "Gender",
                          required: true,
                          placeholder: "Select gender",
                          values: ["Male", "Female", "Other"],
                        })}

                        {form.gender === "Other" &&
                          renderOther("genderOther", "Please specify")}
                      </div>

                      {renderText({
                        field: "qualification",
                        label: "Class / Qualification",
                        required: true,
                        placeholder: "Example: Class 10 / B.Tech",
                      })}

                      {renderText({
                        field: "organization",
                        label: "School / College / Organization",
                        required: true,
                        placeholder: "Enter organization",
                      })}

                      {renderText({
                        field: "phone",
                        label: "Mobile Number",
                        required: true,
                        type: "tel",
                        inputMode: "tel",
                        autoComplete: "tel",
                        placeholder: "10-digit mobile number",
                        sanitize: sanitizePhone,
                        maxLength: 16,
                        hint: "We'll use this to contact you about your classes.",
                      })}

                      {renderText({
                        field: "email",
                        label: "Email Address",
                        required: true,
                        type: "email",
                        inputMode: "email",
                        autoComplete: "email",
                        placeholder: "name@example.com",
                      })}

                      <FormField
                        label="Password"
                        required
                        htmlFor="reg-password"
                        error={errors.password}
                      >
                        <PasswordInput
                          id="reg-password"
                          value={form.password}
                          onChange={(value) => updateForm("password", value)}
                          onBlur={() => handleBlur("password")}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          error={errors.password}
                        />

                        <PasswordStrength value={form.password} />
                      </FormField>

                      <FormField
                        label="Confirm Password"
                        required
                        htmlFor="reg-confirmPassword"
                        error={errors.confirmPassword}
                      >
                        <PasswordInput
                          id="reg-confirmPassword"
                          value={confirmPassword}
                          onChange={(value) => {
                            setConfirmPassword(value);

                            setErrors((current) => {
                              if (!value && !current.confirmPassword) {
                                return current;
                              }

                              return withError(
                                current,
                                "confirmPassword",
                                validateField(
                                  "confirmPassword",
                                  form,
                                  agreed,
                                  value
                                )
                              );
                            });
                          }}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          error={errors.confirmPassword}
                        />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* ---------------- STEP 3 — GUARDIAN ---------------- */}
                {step === 2 && (
                  <div key="step-guardian" className="sk-reg-in">
                    <StepHeading
                      title="Parent / Guardian"
                      subtitle="We keep your parent or guardian informed about classes."
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {renderText({
                        field: "guardianName",
                        label: "Parent / Guardian Name",
                        required: true,
                        placeholder: "Enter guardian name",
                      })}

                      <div>
                        {renderSelect({
                          field: "guardianRelationship",
                          label: "Relationship",
                          required: true,
                          placeholder: "Select relationship",
                          values: ["Father", "Mother", "Guardian", "Other"],
                        })}

                        {form.guardianRelationship === "Other" &&
                          renderOther(
                            "guardianRelationshipOther",
                            "Please specify relationship"
                          )}
                      </div>

                      {renderText({
                        field: "guardianMobile",
                        label: "Mobile Number",
                        required: true,
                        type: "tel",
                        inputMode: "tel",
                        placeholder: "Guardian's 10-digit mobile",
                        sanitize: sanitizePhone,
                        maxLength: 16,
                      })}

                      {renderText({
                        field: "guardianWhatsapp",
                        label: "WhatsApp Number",
                        type: "tel",
                        inputMode: "tel",
                        placeholder: "Optional",
                        sanitize: sanitizePhone,
                        maxLength: 16,
                      })}

                      {renderText({
                        field: "guardianEmail",
                        label: "Email ID",
                        type: "email",
                        inputMode: "email",
                        placeholder: "Optional — guardian@example.com",
                        className: "md:col-span-2",
                      })}
                    </div>
                  </div>
                )}

                {/* ---------------- STEP 4 — LEARNING + ADDRESS ---------------- */}
                {step === 3 && (
                  <div key="step-learning" className="sk-reg-in">
                    <StepHeading
                      title="Online Learning & Address"
                      subtitle="Select the facilities available for your online classes, and where you live."
                    />

                    <fieldset>
                      <legend className="mb-2 block text-sm font-semibold text-[#173B67]">
                        Available Device(s){" "}
                        <span className="text-red-500">*</span>
                      </legend>

                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {DEVICE_OPTIONS.map((device, index) => {
                          const checked = selectedDevices.includes(device);

                          return (
                            <label
                              key={device}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition duration-200 ${
                                checked
                                  ? "border-orange-300 bg-orange-50 font-semibold text-[#173B67] shadow-sm"
                                  : errors.deviceTypes
                                    ? "border-red-300 bg-red-50/40 text-slate-600"
                                    : "border-slate-200 bg-white text-slate-600 hover:-translate-y-px hover:border-orange-200 hover:bg-orange-50/40"
                              }`}
                            >
                              <input
                                id={index === 0 ? "reg-deviceTypes" : undefined}
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDevice(device)}
                                className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                              />

                              <span>{device}</span>
                            </label>
                          );
                        })}
                      </div>

                      {errors.deviceTypes && (
                        <p
                          role="alert"
                          className="sk-field-error mt-1.5 text-xs font-medium text-red-600"
                        >
                          {errors.deviceTypes}
                        </p>
                      )}
                    </fieldset>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                      {renderSelect({
                        field: "internetFacility",
                        label: "Internet Facility",
                        required: true,
                        placeholder: "Select internet facility",
                        values: INTERNET_OPTIONS,
                      })}

                      <div>
                        {renderSelect({
                          field: "preferredClassApp",
                          label: "Preferred Online Class App",
                          required: true,
                          placeholder: "Select class app",
                          values: CLASS_APP_OPTIONS,
                        })}

                        {form.preferredClassApp === "Other" &&
                          renderOther(
                            "preferredClassAppOther",
                            "Please specify the online class app"
                          )}
                      </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <h3 className="mb-4 text-base font-bold text-[#173B67]">
                        Address
                      </h3>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                          label="Address"
                          required
                          htmlFor="reg-address"
                          error={errors.address}
                          className="md:col-span-2"
                        >
                          <textarea
                            {...a11y("address")}
                            rows={3}
                            value={form.address}
                            onChange={(e) =>
                              updateForm("address", e.target.value)
                            }
                            placeholder="House no., street, area"
                            autoComplete="street-address"
                            className={`${TEXTAREA_CLASS} ${
                              errors.address ? INPUT_ERROR_CLASS : ""
                            }`}
                          />
                        </FormField>

                        {renderText({
                          field: "city",
                          label: "City",
                          required: true,
                          placeholder: "Enter city",
                          autoComplete: "address-level2",
                        })}

                        {renderText({
                          field: "pin",
                          label: "PIN Code",
                          required: true,
                          placeholder: "6-digit PIN code",
                          inputMode: "numeric",
                          autoComplete: "postal-code",
                          sanitize: sanitizePin,
                          maxLength: 6,
                        })}

                        {renderSelect({
                          field: "state",
                          label: "State",
                          required: true,
                          placeholder: "Select state",
                          values: STATES,
                          className: "md:col-span-2",
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------- STEP 5 — FINISH ---------------- */}
                {step === 4 && (
                  <div key="step-finish" className="sk-reg-in">
                    <StepHeading
                      title="Almost Done"
                      subtitle="Tell us how you found us, then review your details."
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        {renderSelect({
                          field: "referralSource",
                          label: "How did you hear about SK Computer Education?",
                          required: true,
                          placeholder: "Select source",
                          values: REFERRAL_SOURCE_OPTIONS,
                        })}

                        {form.referralSource === "Other" &&
                          renderOther("referralSourceOther", "Please specify")}
                      </div>

                      {renderText({
                        field: "referralName",
                        label: "Referral Name",
                        placeholder: "Optional",
                      })}

                      {renderText({
                        field: "referralMobile",
                        label: "Referral Mobile",
                        type: "tel",
                        inputMode: "tel",
                        placeholder: "Optional",
                        sanitize: sanitizePhone,
                        maxLength: 16,
                      })}

                      {renderText({
                        field: "referralId",
                        label: "Referral ID",
                        placeholder: "Optional referral ID",
                        className: "md:col-span-2",
                      })}
                    </div>

                    {/* Review */}
                    <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#173B67]">
                        Review Your Details
                      </h3>

                      <div className="mt-2 divide-y divide-slate-200/70">
                        <ReviewRow
                          label="Package"
                          value={
                            selectedPackage
                              ? `${selectedPackage.title} — ₹${selectedPackage.price.toLocaleString("en-IN")}`
                              : ""
                          }
                          onEdit={() => changeStep(0)}
                        />

                        {selectedCourseData?.title && (
                          <ReviewRow
                            label="Course Interested In"
                            value={selectedCourseData.title}
                            onEdit={() => changeStep(0)}
                          />
                        )}

                        <ReviewRow
                          label="Student"
                          value={form.name}
                          onEdit={() => changeStep(1)}
                        />

                        <ReviewRow
                          label="Email"
                          value={form.email}
                          onEdit={() => changeStep(1)}
                        />

                        <ReviewRow
                          label="Mobile"
                          value={form.phone}
                          onEdit={() => changeStep(1)}
                        />

                        <ReviewRow
                          label="Guardian"
                          value={form.guardianName}
                          onEdit={() => changeStep(2)}
                        />

                        <ReviewRow
                          label="Address"
                          value={[form.city, form.state, form.pin]
                            .filter(Boolean)
                            .join(", ")}
                          onEdit={() => changeStep(3)}
                        />
                      </div>
                    </div>

                    {/* Declaration */}
                    <div
                      className={`mt-6 rounded-2xl border p-5 transition-colors duration-200 ${
                        errors.agreed
                          ? "border-red-300 bg-red-50/50"
                          : "border-slate-200 bg-slate-50 hover:border-orange-200"
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          id="reg-agreed"
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => {
                            setAgreed(e.target.checked);

                            if (e.target.checked) {
                              setErrors((current) =>
                                withError(current, "agreed", "")
                              );
                            }
                          }}
                          aria-invalid={errors.agreed ? true : undefined}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />

                        <span className="text-sm leading-relaxed text-slate-600">
                          I agree to the{" "}
                          <Link href="/terms" className={TEXT_LINK}>
                            User Agreement
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy-policy" className={TEXT_LINK}>
                            Privacy Policy
                          </Link>
                          . <span className="text-red-500">*</span>
                        </span>
                      </label>

                      {errors.agreed && (
                        <p
                          role="alert"
                          className="sk-field-error mt-2 pl-7 text-xs font-medium text-red-600"
                        >
                          {errors.agreed}
                        </p>
                      )}
                    </div>

                    {submitError && (
                      <InlineAlert
                        className="mt-5"
                        title={submitError.title}
                        message={submitError.message}
                        onClose={() => setSubmitError(null)}
                      />
                    )}
                  </div>
                )}

                {/* ---------------- NAVIGATION ---------------- */}
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={loading}
                      className={`${BTN_GHOST} group`}
                    >
                      <ArrowLeft
                        size={16}
                        className="transition-transform duration-200 group-hover:-translate-x-1"
                      />
                      Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < LAST_STEP ? (
                    <button
                      type="submit"
                      disabled={packagesLoading}
                      className={`${BTN_PRIMARY} group min-w-[160px]`}
                    >
                      Continue
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || packagesLoading}
                      className={`${BTN_PRIMARY} min-w-[220px]`}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          Continue to Payment
                        </>
                      )}
                    </button>
                  )}
                </div>

                {step === LAST_STEP && (
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Your registration details will be securely processed
                    before payment.
                  </p>
                )}
              </form>
            </div>

            {/* ===================== SUMMARY PANEL ===================== */}
            <aside className="order-last space-y-4 lg:sticky lg:top-24">
              <div className="sk-side-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2A52] via-[#173B67] to-[#1d4d85] p-5 text-white shadow-xl shadow-blue-900/25">
                <div className="sk-reg-orb-sm pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-400/25 blur-3xl" />
                <p className="relative text-xs font-semibold uppercase tracking-wider text-blue-200/80">
                  Your Selection
                </p>

                {selectedPackage ? (
                  <div className="sk-reg-in relative mt-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-900/30">
                        <Package size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-bold leading-snug text-white">
                          {selectedPackage.title}
                        </h3>

                        <p className="mt-0.5 text-xs text-blue-200/80">
                          {packageIncludes.length} learning areas
                        </p>
                      </div>
                    </div>

                    {selectedCourseData?.title && (
                      <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-blue-50">
                        Interested in: {selectedCourseData.title}
                      </p>
                    )}

                    <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
                      <span className="text-sm text-blue-200/80">Total</span>

                      <span className="text-2xl font-extrabold text-orange-400">
                        ₹{selectedPackage.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl relative border border-dashed border-white/20 bg-white/5 p-4 text-sm text-blue-100">
                    Choose a package in step 1 to see your price here.
                  </p>
                )}
              </div>

              <div className="sk-reg-in space-y-3 rounded-2xl border border-slate-200 border-l-4 border-l-orange-500 bg-white p-5 text-xs text-slate-500 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="shrink-0 text-[#173B67]" />
                  Secure payment through Razorpay
                </div>

                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="shrink-0 text-[#173B67]" />
                  Your password is never stored in the browser
                </div>

                <p className="border-t border-slate-100 pt-3">
                  Need help?{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-[#173B67] transition-colors hover:text-orange-500"
                  >
                    Contact us
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>

        <style jsx global>{`
          @keyframes skRegIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .sk-reg-in {
            animation: skRegIn 0.3s ease-out both;
          }

          .sk-reg-band {
            background:
              radial-gradient(900px 380px at 85% -20%, rgba(59, 130, 246, 0.3), transparent 60%),
              radial-gradient(800px 360px at -5% 110%, rgba(37, 99, 235, 0.4), transparent 60%),
              linear-gradient(135deg, #071c3a 0%, #0f2f5f 50%, #173b67 100%);
          }
          .sk-reg-grid {
            background-image: radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px);
            background-size: 26px 26px;
            -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
            mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
          }
          .sk-reg-orb {
            border-radius: 9999px;
            filter: blur(70px);
          }
          .sk-reg-orb-a {
            width: 300px;
            height: 300px;
            left: -60px;
            top: -40px;
            background: #2563eb;
            opacity: 0.5;
            animation: skRegFloat 14s ease-in-out infinite;
          }
          .sk-reg-orb-b {
            width: 260px;
            height: 260px;
            right: 6%;
            top: 40px;
            background: #3b82f6;
            opacity: 0.3;
            animation: skRegFloat 18s ease-in-out -5s infinite reverse;
          }
          .sk-reg-icon::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 2px solid rgba(251, 146, 60, 0.7);
            animation: skRegPing 2.4s ease-out infinite;
          }
          .sk-reg-card {
            animation: skRegCard 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards;
          }
          .sk-side-card {
            animation: skRegCard 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s backwards;
          }
          .sk-reg-bar {
            background-size: 200% 100%;
            animation: skRegBar 7s linear infinite;
          }
          .sk-step-current {
            animation: skStepPulse 2.2s ease-out infinite;
          }

          @keyframes skRegFloat {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(40px, 24px, 0) scale(1.12); }
          }
          @keyframes skRegPing {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes skRegCard {
            from { opacity: 0; transform: translateY(22px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes skRegBar {
            from { background-position: 0% 0; }
            to { background-position: 200% 0; }
          }
          @keyframes skStepPulse {
            0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.45); }
            70%, 100% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .sk-reg-orb, .sk-reg-icon::after, .sk-reg-card, .sk-side-card,
            .sk-reg-bar, .sk-step-current, .sk-reg-in {
              animation: none !important;
            }
          }
        `}</style>
      </section>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-[#EEF3FA] px-5 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Loader2 size={18} className="animate-spin text-orange-500" />

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
