import { type Loan, formatEther, formatDate } from "@/lib/contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
export function AdminLoanCard({
  loan,
  onApprove,
  onPenalty,
  isProcessing,
}: {
  loan: Loan
  onApprove: (loanId: number) => void
  onPenalty: (loanId: number) => void
  isProcessing: boolean
}) {
  const now = Math.floor(Date.now() / 1000)
  const isOverdue = Number(loan.repaymentDeadline) < now && !loan.isRepaid && loan.isApproved
  return (
    <Card className={isOverdue ? "border-red-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Loan #{loan.id}</CardTitle>
            <CardDescription>
              Borrower: {loan.borrower.substring(0, 6)}...{loan.borrower.substring(loan.borrower.length - 4)}
            </CardDescription>
          </div>
          <Badge variant={loan.isApproved ? (loan.isRepaid ? "outline" : "default") : "secondary"}>
            {loan.isRepaid ? "Repaid" : loan.isApproved ? "Approved" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">{formatEther(loan.amount)} ETH</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interest</p>
            <p className="font-medium">{Number(loan.interestRate)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total to Repay</p>
            <p className="font-medium">{formatEther(loan.totalRepaymentAmount)} ETH</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className="font-medium flex items-center gap-1">
              {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
              {formatDate(loan.repaymentDeadline)}
            </p>
          </div>
        </div>
        {loan.isApproved && !loan.isRepaid && (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Repaid Amount</p>
              <p className="font-medium">{formatEther(loan.amountRepaid)} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-medium">{formatEther(loan.totalRepaymentAmount - loan.amountRepaid)} ETH</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!loan.isApproved ? (
          <Button onClick={() => onApprove(loan.id)} disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Approve Loan"
            )}
          </Button>
        ) : loan.isRepaid ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <span>Fully Repaid</span>
          </div>
        ) : isOverdue ? (
          <Button onClick={() => onPenalty(loan.id)} disabled={isProcessing} variant="destructive" className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Apply Penalty"
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4" />
            <span>Awaiting Repayment</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}