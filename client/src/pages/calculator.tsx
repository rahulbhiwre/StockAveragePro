import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calculator as CalculatorIcon, RotateCcw, Info } from "lucide-react";

const calculatorSchema = z.object({
  currentLtp: z.number().min(0.01, "Current LTP must be greater than 0"),
  quantityToPurchase: z.number().min(1, "Quantity must be at least 1"),
  existingQuantity: z.number().min(0, "Existing quantity cannot be negative"),
  existingAvgPrice: z.number().min(0.01, "Average price must be greater than 0"),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface CalculationResult {
  newAveragePrice: number;
  currentInvestment: number;
  newInvestment: number;
  totalInvestment: number;
  totalQuantity: number;
}

export default function Calculator() {
  const [result, setResult] = useState<CalculationResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    mode: "onBlur",
  });

  const onSubmit = (data: CalculatorFormData) => {
    const currentInvestment = data.existingQuantity * data.existingAvgPrice;
    const newInvestment = data.quantityToPurchase * data.currentLtp;
    const totalInvestment = currentInvestment + newInvestment;
    const totalQuantity = data.existingQuantity + data.quantityToPurchase;
    const newAveragePrice = totalInvestment / totalQuantity;

    setResult({
      newAveragePrice,
      currentInvestment,
      newInvestment,
      totalInvestment,
      totalQuantity,
    });
  };

  const handleClear = () => {
    reset();
    setResult(null);
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CalculatorIcon className="w-4 h-4 mr-2" />
                  Calculate Average
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