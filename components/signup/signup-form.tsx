"use client";

import React from "react";

import { useState, useRef } from "react";
import { List, type RowComponentProps } from "react-window";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Upload,
  X,
  User,
  FileText,
  Camera,
  PenTool,
  Home,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Country, useCountries } from "@/hooks/use-countries";
import { useAuth } from "@/hooks/api/useAuth";
import { useRouter } from "next/navigation";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { DateTimePicker } from "../ui/datetime";
import { compressImage } from "@/lib/image-compression";

// Error tooltip component
function ErrorTooltip({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive"
        >
          <AlertCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-destructive text-destructive-foreground"
      >
        {error}
      </TooltipContent>
    </Tooltip>
  );
}

// Types
interface FormData {
  first_name: string,
  last_name: string,
  birthdate: string,
  email: string;
  password: string;
  bvn: string;
  nin: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  occupation: string;
  nextOfKin: string;
  nextOfKinPhone: string;
}

interface UploadedFiles {
  passport: File | null;
  identity: File | null;
  signature: File | null;
  utilityBill: File | null;
}

// Steps configuration
const STEPS = [
  { id: 0, title: "Account Credentials", icon: User },
  { id: 1, title: "BVN Verification", icon: FileText },
  { id: 2, title: "NIN Verification", icon: User },
  { id: 3, title: "Personal Information", icon: Home },
  { id: 4, title: "Passport Photo", icon: Camera },
  { id: 5, title: "Identity", icon: User },
  { id: 6, title: "Utility Bill", icon: FileText },
  { id: 7, title: "Signature", icon: PenTool },
  { id: 8, title: "Review", icon: ClipboardCheck },
];

export default function SignUpForm() {
  const { signup: { mutateAsync: signup, isPending: isSubmitting } } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    birthdate: new Date().toISOString(),
    bvn: "",
    nin: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "NG",
    phone: "",
    email: "",
    password: "",
    occupation: "",
    nextOfKin: "",
    nextOfKinPhone: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    passport: null,
    identity: null,
    signature: null,
    utilityBill: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileUpload = async (
    key: keyof UploadedFiles,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    let file = files[0];

    try {
      // ✅ Only compress images (never PDFs)
      if (file.type.startsWith("image/")) {
        file = await compressImage(file);
      }

      setUploadedFiles((prev) => ({ ...prev, [key]: file }));

      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: "" }));
      }
    } catch (err) {
      console.error("Image compression failed:", err);
      setErrors((prev) => ({
        ...prev,
        [key]: "Image compression failed. Please try another image.",
      }));
    }
  };

  const removeFile = (key: keyof UploadedFiles) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: null }));
  };

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignatureAsFile = (): File | null => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasSignature) return null;

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "signature.png", { type: "image/png" });
          resolve(file);
        } else {
          resolve(null);
        }
      }, "image/png");
    }) as unknown as File | null;
  };

  const validateCredentials = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // Validation functions
  const validateBVN = (): boolean => {
    if (!formData.bvn || formData.bvn.length !== 11) {
      setErrors({ bvn: "BVN must be exactly 11 digits" });
      return false;
    }
    if (!/^\d+$/.test(formData.bvn)) {
      setErrors({ bvn: "BVN must contain only numbers" });
      return false;
    }
    return true;
  };

  const validateNIN = (): boolean => {
    if (!formData.nin || formData.nin.length !== 11) {
      setErrors({ nin: "NIN must be exactly 11 digits" });
      return false;
    }
    if (!/^\d+$/.test(formData.nin)) {
      setErrors({ nin: "NIN must contain only numbers" });
      return false;
    }
    return true;
  };

  const validatePersonalInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.streetAddress.trim())
      newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.occupation.trim())
      newErrors.occupation = "Occupation is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = async () => {
    setErrors({});

    switch (step) {
      case 0:
        if (!validateCredentials()) return;
        break;
      case 1:
        if (!validateBVN()) return;
        break;
      case 2:
        if (!validateNIN()) return;
        break;
      case 3:
        if (!validatePersonalInfo()) return;
        break;
      case 4:
        if (!uploadedFiles.passport) {
          setErrors({ passport: "Passport photograph is required" });
          return;
        }
        break;
      case 5:
        if (!uploadedFiles.identity) {
          setErrors({ identity: "ID is required" });
          return;
        }
        break;
      case 6:
        if (!uploadedFiles.utilityBill) {
          setErrors({ utilityBill: "Utility bill is required" });
          return;
        }
        break;
      case 7:
        if (!hasSignature && !uploadedFiles.signature) {
          setErrors({ signature: "Signature is required" });
          return;
        }
        if (hasSignature && !uploadedFiles.signature) {
          const canvas = signatureCanvasRef.current;
          if (canvas) {
            canvas.toBlob(async (blob) => {
              if (blob) {
                const rawFile = new File([blob], "signature.png", {
                  type: "image/png",
                });

                const compressed = await compressImage(rawFile);

                setUploadedFiles((prev) => ({
                  ...prev,
                  signature: compressed,
                }));
              }
            }, "image/png");
          }
        }
        break;
    }

    if (step < 8) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    // Simulate API call
    await signup({
      password: formData.password,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      birthdate: formData.birthdate,
      kyc: {
        bvn: +formData.bvn,
        nin: +formData.nin,
        country: formData.country,
        occupation: formData.occupation,
        religion: "",
        altEmail: "",
        altPhone: "",
        currentAddress: formData.streetAddress,
        motherMaidenName: "",
        residentState: formData.state,
        residentLGA: formData.city,
        residentOtherLGA: ""
      },
      passport: uploadedFiles.passport,
      utility: uploadedFiles.utilityBill,
      signature: uploadedFiles.signature,
      identity: uploadedFiles.identity,
    });

    setSubmitSuccess(true)
  };

  if (submitSuccess) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="w-full max-w-md bg-card border-border">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Account Created Successfully!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your account has been created. You will receive a confirmation
                email shortly.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/login">Continue to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">SecureBank</h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                Create Your Account
              </h2>
              <span className="text-sm text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step indicators */}
              <div className="hidden md:flex justify-between mt-4">
                {STEPS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.id}
                      className={`flex flex-col items-center ${s.id <= step ? "text-primary" : "text-muted-foreground"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${s.id < step
                          ? "bg-primary text-primary-foreground"
                          : s.id === step
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {s.id < step ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs text-center max-w-[80px]">
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">
                {STEPS[step].title}
              </CardTitle>
              <CardDescription>
                {step === 0 && "Create your account"}
                {step === 1 && "Enter your Bank Verification Number (BVN)"}
                {step === 2 && "Enter your National Identification Number (NIN)"}
                {step === 3 && "Provide your personal details"}
                {step === 4 && "Upload a clear passport photograph"}
                {step === 5 && "Take or upload a photo of your ID"}
                {step === 6 && "Upload a recent utility bill"}
                {step === 7 && "Draw or upload your signature"}
                {step === 8 && "Review all your information before submission"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {/* Step 1: BVN */}
                {step === 0 && (
                  <StepCredentials
                    formData={formData}
                    onChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {/* Step 1: BVN */}
                {step === 1 && (
                  <StepBVN
                    value={formData.bvn}
                    onChange={handleInputChange}
                    error={errors.bvn}
                  />
                )}

                {/* Step 2: NIN */}
                {step === 2 && (
                  <StepNIN
                    value={formData.nin}
                    onChange={handleInputChange}
                    error={errors.nin}
                  />
                )}

                {/* Step 3: Personal Information */}
                {step === 3 && (
                  <StepPersonalInfo
                    formData={formData}
                    onChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                    errors={errors}
                  />
                )}

                {/* Step 4: Passport Photo */}
                {step === 4 && (
                  <StepFileUpload
                    title="Passport Photograph"
                    description="Upload a clear, recent passport photograph with a white or light background"
                    file={uploadedFiles.passport}
                    onUpload={(files) => handleFileUpload("passport", files)}
                    onRemove={() => removeFile("passport")}
                    error={errors.passport}
                    accept="image/*"
                  />
                )}

                {/* Step 5: Identity Photo */}
                {step === 5 && (
                  <StepFileUpload
                    title="Identity Image"
                    description="Upload a clear photo of your identity verification"
                    file={uploadedFiles.identity}
                    onUpload={(files) => handleFileUpload("identity", files)}
                    onRemove={() => removeFile("identity")}
                    error={errors.identity}
                    accept="image/*"
                  />
                )}

                {/* Step 6: Utility Bill */}
                {step === 6 && (
                  <StepFileUpload
                    title="Utility Bill"
                    description="Upload a recent utility bill (electricity, water, gas) not older than 3 months"
                    file={uploadedFiles.utilityBill}
                    onUpload={(files) => handleFileUpload("utilityBill", files)}
                    onRemove={() => removeFile("utilityBill")}
                    error={errors.utilityBill}
                    accept="image/*,.pdf"
                  />
                )}

                {/* Step 7: Signature */}
                {step === 7 && (
                  <StepSignature
                    canvasRef={signatureCanvasRef}
                    onStartDrawing={startDrawing}
                    onDraw={draw}
                    onStopDrawing={stopDrawing}
                    onClear={clearSignature}
                    hasSignature={hasSignature}
                    file={uploadedFiles.signature}
                    onUpload={(files) => handleFileUpload("signature", files)}
                    onRemove={() => {
                      removeFile("signature");
                      clearSignature();
                    }}
                    error={errors.signature}
                  />
                )}

                {/* Step 8: Review */}
                {step === 8 && (
                  <StepReview
                    formData={formData}
                    uploadedFiles={uploadedFiles}
                    hasSignature={hasSignature}
                  />
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-border">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={goBack}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}

                {step < 8 ? (
                  <Button
                    type="button"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={goNext}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}

function StepCredentials({
  formData,
  onChange,
  errors,
}: {
  formData: FormData & { repeat_password?: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
}) {
  const [birthdate, setBirthdate] = React.useState<Date | null>(
    formData.birthdate ? new Date(formData.birthdate) : null
  );

  const handleDateChange = (date: Date | null) => {
    setBirthdate(date);
    // convert to YYYY-MM-DD format for formData
    onChange({
      target: { name: "birthdate", value: date ? format(date, "yyyy-MM-dd") : "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <motion.div
      key="step-credentials"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="first_name" className="text-foreground">
          First Name
        </Label>
        <div className="relative">
          <Input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={onChange}
            placeholder="Enter your first name"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.first_name ? "border-destructive" : ""
              }`}
          />
          <ErrorTooltip error={errors.first_name} />
        </div>
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="last_name" className="text-foreground">
          Last Name
        </Label>
        <div className="relative">
          <Input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={onChange}
            placeholder="Enter your last name"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.last_name ? "border-destructive" : ""
              }`}
          />
          <ErrorTooltip error={errors.last_name} />
        </div>
      </div>

      {/* Birthdate */}
      <div className="space-y-2">
        <Label htmlFor="birthdate" className="text-foreground">
          Birthdate
        </Label>
        <DateTimePicker
          value={birthdate || new Date()}
          onChange={(date) => {
            handleDateChange(date);
          }}
          className={errors.birthdate ? "border-destructive" : ""}
        />
        <ErrorTooltip error={errors.birthdate} />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          Email Address
        </Label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            placeholder="you@example.com"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.email ? "border-destructive" : ""
              }`}
          />
          <ErrorTooltip error={errors.email} />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Enter a secure password"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.password ? "border-destructive" : ""
              }`}
          />
          <ErrorTooltip error={errors.password} />
        </div>
      </div>

      {/* Repeat Password */}
      <div className="space-y-2">
        <Label htmlFor="repeat_password" className="text-foreground">
          Repeat Password
        </Label>
        <div className="relative">
          <Input
            id="repeat_password"
            name="repeat_password"
            type="password"
            value={formData.repeat_password || ""}
            onChange={onChange}
            placeholder="Repeat your password"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.repeat_password ? "border-destructive" : ""
              }`}
          />
          <ErrorTooltip error={errors.repeat_password} />
        </div>
      </div>
    </motion.div>
  );
}

// Step Components
function StepBVN({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <motion.div
      key="step-bvn"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="bvn" className="text-foreground">
          Bank Verification Number (BVN)
        </Label>
        <div className="relative">
          <Input
            id="bvn"
            name="bvn"
            value={value}
            onChange={onChange}
            maxLength={11}
            placeholder="Enter your 11-digit BVN"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${error ? "border-destructive" : ""}`}
          />
          <ErrorTooltip error={error} />
        </div>
      </div>
      <Alert className="bg-muted border-border">
        <AlertDescription className="text-sm text-muted-foreground">
          Your BVN is a unique 11-digit number that identifies you across all
          Nigerian banks. Dial *565*0# on your registered phone number to
          retrieve it.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

function StepNIN({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <motion.div
      key="step-nin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="nin" className="text-foreground">
          National Identification Number (NIN)
        </Label>
        <div className="relative">
          <Input
            id="nin"
            name="nin"
            value={value}
            onChange={onChange}
            maxLength={11}
            placeholder="Enter your 11-digit NIN"
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${error ? "border-destructive" : ""}`}
          />
          <ErrorTooltip error={error} />
        </div>
      </div>
      <Alert className="bg-muted border-border">
        <AlertDescription className="text-sm text-muted-foreground">
          {"Don't have a NIN? Visit the "}
          <Link
            href="https://nrbvn.ares.nrbvn.com"
            target="_blank"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            NIN Registration Portal
            <ExternalLink className="w-3 h-3" />
          </Link>
          {" to create one."}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

function StepPersonalInfo({
  formData,
  onChange,
  onSelectChange,
  errors,
}: {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: keyof FormData, value: string) => void;
  errors: Record<string, string>;
}) {
  const { countries } = useCountries()

  return (
    <motion.div
      key="step-personal"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="streetAddress" className="text-foreground">
            Street Address
          </Label>
          <div className="relative">
            <Input
              id="streetAddress"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={onChange}
              placeholder="e.g., 15 Adeola Odeku Street"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.streetAddress ? "border-destructive" : ""}`}
            />
            <ErrorTooltip error={errors.streetAddress} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-foreground">
            City
          </Label>
          <div className="relative">
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder="e.g., Victoria Island"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.city ? "border-destructive" : ""}`}
            />
            <ErrorTooltip error={errors.city} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="state" className="text-foreground">
            State
          </Label>
          <div className="relative">
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={onChange}
              placeholder="e.g., Lagos"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.state ? "border-destructive" : ""}`}
            />
            <ErrorTooltip error={errors.state} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-foreground">
            Postal Code{" "}
            <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            placeholder="e.g., 101241"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="text-foreground">
            Country
          </Label>
          <div className="relative">
            <Select
              value={formData.country}
              onValueChange={(value) => onSelectChange("country", value)}
            >
              <SelectTrigger
                className={`w-full cursor-pointer bg-input border-border text-foreground ${errors.country ? "border-destructive" : ""}`}
              >
                <SelectValue placeholder="Select country">
                  {formData.country
                    ? countries.find((c) => c.code === formData.country)?.name
                    : "Select country"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <VirtualizedCountryItems countries={countries} />
              </SelectContent>
            </Select>
            <ErrorTooltip error={errors.country} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground">
            Phone Number
          </Label>
          <div className="relative">
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={onChange}
              placeholder="e.g., 08012345678"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.phone ? "border-destructive" : ""}`}
            />
            <ErrorTooltip error={errors.phone} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              placeholder="you@example.com"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.email ? "border-destructive" : ""}`}
            />
            <ErrorTooltip error={errors.email} />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="occupation" className="text-foreground">
            Occupation
          </Label>
          <div className="relative">
            <Input
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={onChange}
              placeholder="e.g., Software Engineer"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 ${errors.occupation ? "border-destructive" : ""}`}
            />
            <ErrorTooltip error={errors.occupation} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextOfKin" className="text-foreground">
            Next of Kin (Full Name){" "}
            <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Input
            id="nextOfKin"
            name="nextOfKin"
            value={formData.nextOfKin}
            onChange={onChange}
            placeholder="Enter full name"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextOfKinPhone" className="text-foreground">
            Next of Kin Phone{" "}
            <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Input
            id="nextOfKinPhone"
            name="nextOfKinPhone"
            type="tel"
            value={formData.nextOfKinPhone}
            onChange={onChange}
            placeholder="e.g., 08012345678"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </motion.div>
  );
}

function StepFileUpload({
  title,
  description,
  file,
  onUpload,
  onRemove,
  error,
  accept,
}: {
  title: string;
  description: string;
  file: File | null;
  onUpload: (files: FileList | null) => void;
  onRemove: () => void;
  error?: string;
  accept: string;
}) {
  return (
    <motion.div
      key={`step-upload-${title}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">{description}</p>

      {!file ? (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG or PDF (max 10MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      ) : (
        <div className="relative border border-border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-4">
            {file.type.startsWith("image/") ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </motion.div>
  );
}

function StepSignature({
  canvasRef,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  onClear,
  hasSignature,
  file,
  onUpload,
  onRemove,
  error,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStartDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDraw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onStopDrawing: () => void;
  onClear: () => void;
  hasSignature: boolean;
  file: File | null;
  onUpload: (files: FileList | null) => void;
  onRemove: () => void;
  error?: string;
}) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");

  return (
    <motion.div
      key="step-signature"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("draw")}
          className={
            mode === "draw"
              ? "bg-primary text-primary-foreground"
              : "border-border"
          }
        >
          <PenTool className="w-4 h-4 mr-2" />
          Draw Signature
        </Button>
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
          className={
            mode === "upload"
              ? "bg-primary text-primary-foreground"
              : "border-border"
          }
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Signature
        </Button>
      </div>

      {mode === "draw" ? (
        <div className="space-y-4">
          <div className="relative border-2 border-border rounded-lg overflow-hidden bg-muted/30">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full h-48 cursor-crosshair touch-none"
              onMouseDown={onStartDrawing}
              onMouseMove={onDraw}
              onMouseUp={onStopDrawing}
              onMouseLeave={onStopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground">
                  Draw your signature here
                </p>
              </div>
            )}
          </div>
          {hasSignature && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              className="border-border bg-transparent"
            >
              Clear Signature
            </Button>
          )}
        </div>
      ) : (
        <>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Click to upload
                  </span>{" "}
                  your signature
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG or JPG (max 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => onUpload(e.target.files)}
              />
            </label>
          ) : (
            <div className="relative border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-16 rounded-lg overflow-hidden bg-white">
                  <Image
                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                    alt="Signature Preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </motion.div>
  );
}

function StepReview({
  formData,
  uploadedFiles,
  hasSignature,
}: {
  formData: FormData;
  uploadedFiles: UploadedFiles;
  hasSignature: boolean;
}) {
  const { countries } = useCountries()
  const reviewItems = [
    { label: "BVN", value: formData.bvn ? `****${formData.bvn.slice(-4)}` : "" },
    { label: "NIN", value: formData.nin ? `****${formData.nin.slice(-4)}` : "" },
    {
      label: "Address",
      value: [
        formData.streetAddress,
        formData.city,
        formData.state,
        formData.postalCode,
        countries.find((c) => c.code === formData.country)?.name,
      ]
        .filter(Boolean)
        .join(", "),
    },
    { label: "Phone", value: formData.phone },
    { label: "Email", value: formData.email },
    { label: "Occupation", value: formData.occupation },
    { label: "Next of Kin", value: formData.nextOfKin },
    { label: "Next of Kin Phone", value: formData.nextOfKinPhone },
  ];

  const documentItems = [
    {
      label: "Passport Photo",
      uploaded: !!uploadedFiles.passport,
      file: uploadedFiles.passport,
    },
    {
      label: "Identity",
      uploaded: !!uploadedFiles.identity,
      file: uploadedFiles.identity,
    },
    {
      label: "Signature",
      uploaded: !!uploadedFiles.signature || hasSignature,
      file: uploadedFiles.signature,
    },
    {
      label: "Utility Bill",
      uploaded: !!uploadedFiles.utilityBill,
      file: uploadedFiles.utilityBill,
    },
  ];

  return (
    <motion.div
      key="step-review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviewItems.map((item) => (
            <div
              key={item.label}
              className="flex justify-between py-2 border-b border-border"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Uploaded Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                {item.file && item.file.type.startsWith("image/") ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                    <Image
                      src={URL.createObjectURL(item.file) || "/placeholder.svg"}
                      alt={item.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <span className="text-foreground">{item.label}</span>
              </div>
              {item.uploaded ? (
                <div className="flex items-center gap-1 text-primary">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Uploaded</span>
                </div>
              ) : (
                <span className="text-sm text-destructive">Missing</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Alert className="bg-primary/10 border-primary/30">
        <AlertDescription className="text-sm text-foreground">
          Please review all the information above carefully. Once submitted,
          your application will be processed and you will receive a confirmation
          email.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}


export function VirtualizedCountryItems({ countries }: { countries: Country[] }) {
  function CountryRow({
    index,
    countries,
    style
  }: RowComponentProps<{ countries: Country[] }>) {
    const country = countries[index];
    return (
      <div style={style}>
        <SelectItem key={country.code} value={country.code}>
          {country.name}
        </SelectItem>
      </div>
    );
  }
  return (
    <List
      rowComponent={CountryRow}
      rowCount={countries.length}
      rowHeight={36} // height of each SelectItem
      rowProps={{ countries }} // pass the countries to each row
      defaultHeight={300} // visible height of dropdown
      style={{ width: "100%" }}
    />
  );
}