import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Calculator as CalculatorIcon, RotateCcw, Info, AlertTriangle, CheckCircle } from "lucide-react";

const calculatorSchema = z.object({
  currentLtp: z.number()
    .min(0.01, "Current LTP must be greater than ₹0.01")
    .max(50000, "Current LTP cannot exceed ₹50,000 per share")
    .refine((val) => Number(val.toFixed(2)) === val, "Price can have maximum 2 decimal places"),
  quantityToPurchase: z.number()
    .min(1, "Quantity must be at least 1 share")
    .max(1000000, "Quantity cannot exceed 10,00,000 shares")
    .int("Quantity must be a whole number"),
  existingQuantity: z.number()
    .min(0, "Existing quantity cannot be negative")
    .max(1000000, "Existing quantity cannot exceed 10,00,000 shares")
    .int("Existing quantity must be a whole number"),
  existingAvgPrice: z.number()
    .min(0.01, "Average price must be greater than ₹0.01")
    .max(50000, "Average price cannot exceed ₹50,000 per share")
    .refine((val) => Number(val.toFixed(2)) === val, "Price can have maximum 2 decimal places"),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface CalculationResult {
  newAveragePrice: number;
  currentInvestment: number;
  newInvestment: number;
  totalInvestment: number;
  totalQuantity: number;
}

interface ValidationWarning {
  type: 'warning' | 'info' | 'success';
  message: string;
}

export default function Calculator() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    mode: "onChange",
  });

  // Watch all form values for real-time validation
  const watchedValues = watch();

  // Business logic validation function
  const validateBusinessLogic = (data: CalculatorFormData): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const currentInvestment = data.existingQuantity * data.existingAvgPrice;
    const newInvestment = data.quantityToPurchase * data.currentLtp;
    const totalInvestment = currentInvestment + newInvestment;
    const totalQuantity = data.existingQuantity + data.quantityToPurchase;
    const newAveragePrice = totalInvestment / totalQuantity;

    // Check for significant price differences
    const priceDifference = Math.abs(data.currentLtp - data.existingAvgPrice);
    const priceDifferencePercent = (priceDifference / data.existingAvgPrice) * 100;

    if (priceDifferencePercent > 50) {
      warnings.push({
        type: 'warning',
        message: `Current LTP differs by ${priceDifferencePercent.toFixed(1)}% from your existing average price. Please verify the price.`
      });
    }

    // Check for large investment amounts
    if (newInvestment > 1000000) {
      warnings.push({
        type: 'warning',
        message: `New investment amount is ₹${(newInvestment/100000).toFixed(1)} lakhs. This is a significant investment.`
      });
    }

    // Check for averaging down vs averaging up
    if (data.currentLtp < data.existingAvgPrice) {
      warnings.push({
        type: 'info',
        message: `You're averaging down - buying at ₹${data.currentLtp.toFixed(2)} vs existing average of ₹${data.existingAvgPrice.toFixed(2)}.`
      });
    } else if (data.currentLtp > data.existingAvgPrice) {
      warnings.push({
        type: 'info',
        message: `You're averaging up - buying at ₹${data.currentLtp.toFixed(2)} vs existing average of ₹${data.existingAvgPrice.toFixed(2)}.`
      });
    }

    // Positive feedback for reasonable transactions
    if (priceDifferencePercent <= 20 && newInvestment <= 500000) {
      warnings.push({
        type: 'success',
        message: 'This looks like a reasonable investment adjustment.'
      });
    }

    return warnings;
  };

  const onSubmit = async (data: CalculatorFormData) => {
    setIsCalculating(true);
    
    // Simulate calculation time for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentInvestment = data.existingQuantity * data.existingAvgPrice;
    const newInvestment = data.quantityToPurchase * data.currentLtp;
    const totalInvestment = currentInvestment + newInvestment;
    const totalQuantity = data.existingQuantity + data.quantityToPurchase;
    const newAveragePrice = totalInvestment / totalQuantity;

    // Validate business logic
    const businessWarnings = validateBusinessLogic(data);
    setWarnings(businessWarnings);

    setResult({
      newAveragePrice: Number(newAveragePrice.toFixed(2)),
      currentInvestment: Number(currentInvestment.toFixed(2)),
      newInvestment: Number(newInvestment.toFixed(2)),
      totalInvestment: Number(totalInvestment.toFixed(2)),
      totalQuantity,
    });

    setIsCalculating(false);
  };

  const handleClear = () => {
    if (result || Object.keys(watchedValues).some(key => watchedValues[key as keyof typeof watchedValues])) {
      setShowClearConfirm(true);
    } else {
      reset();
      setResult(null);
      setWarnings([]);
    }
  };

  const confirmClear = () => {
    reset();
    setResult(null);
    setWarnings([]);
    setShowClearConfirm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <TrendingUp className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Stock Average Calculator
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Calculate your new average price per share after additional purchases
          </p>
        </div>

        {/* Validation Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-3 mb-6">
            {warnings.map((warning, index) => (
              <Alert 
                key={index} 
                className={`${
                  warning.type === 'warning' ? 'border-warning bg-warning/10' :
                  warning.type === 'success' ? 'border-success bg-success/10' :
                  'border-primary bg-primary/10'
                }`}
              >
                {warning.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                ) : warning.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Info className="h-4 w-4 text-primary" />
                )}
                <AlertDescription className={`${
                  warning.type === 'warning' ? 'text-warning' :
                  warning.type === 'success' ? 'text-success' :
                  'text-primary'
                } font-medium`}>
                  {warning.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Calculator Card */}
        <Card className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FloatingLabelInput
                {...register("currentLtp", { valueAsNumber: true })}
                id="currentLtp"
                type="number"
                step="0.01"
                min="0"
                label="Current LTP (Last Traded Price) ₹"
                error={errors.currentLtp?.message}
              />

              <FloatingLabelInput
                {...register("quantityToPurchase", { valueAsNumber: true })}
                id="quantityToPurchase"
                type="number"
                step="1"
                min="0"
                label="Quantity to Purchase"
                error={errors.quantityToPurchase?.message}
              />

              <FloatingLabelInput
                {...register("existingQuantity", { valueAsNumber: true })}
                id="existingQuantity"
                type="number"
                step="1"
                min="0"
                label="Existing Quantity Owned"
                error={errors.existingQuantity?.message}
              />

              <FloatingLabelInput
                {...register("existingAvgPrice", { valueAsNumber: true })}
                id="existingAvgPrice"
                type="number"
                step="0.01"
                min="0"
                label="Existing Average Price per Share ₹"
                error={errors.existingAvgPrice?.message}
              />

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  type="submit"
                  disabled={isCalculating}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCalculating ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <CalculatorIcon className="w-4 h-4 mr-2" />
                      Calculate Average
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="px-4 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* Clear Confirmation Dialog */}
              {showClearConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-card p-6 rounded-lg border border-border max-w-sm mx-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Clear All Data?</h3>
                    <p className="text-muted-foreground mb-4">This will clear all input fields and calculation results. This action cannot be undone.</p>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={confirmClear}
                        variant="destructive"
                        className="flex-1"
                      >
                        Yes, Clear All
                      </Button>
                      <Button 
                        onClick={() => setShowClearConfirm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>

          {/* Results Section */}
          {result && (
            <div className="bg-muted border-t border-border p-6">
              <div className="text-center">
                <div className="mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    New Average Price per Share
                  </span>
                </div>
                <div className="text-3xl font-semibold text-success mb-4">
                  {formatCurrency(result.newAveragePrice)}
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-card rounded-lg p-4 text-left space-y-2">
                  <h4 className="font-medium text-foreground mb-3 text-center">
                    Calculation Breakdown
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Investment:</span>
                    <span className="font-medium">{formatCurrency(result.currentInvestment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New Investment:</span>
                    <span className="font-medium">{formatCurrency(result.newInvestment)}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-foreground">Total Investment:</span>
                      <span>{formatCurrency(result.totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-foreground">Total Quantity:</span>
                      <span>{result.totalQuantity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="text-primary mt-1 mr-3 w-5 h-5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <h4 className="font-medium mb-1">How it works</h4>
              <p className="leading-relaxed">
                The calculator uses the weighted average method:{" "}
                <strong>New Average = (Current Investment + New Investment) ÷ Total Quantity</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>© 2024 Stock Calculator. For educational purposes only.</p>
        </div>
      </div>
    </div>
  );
}