"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import Papa from "papaparse"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { importMembers } from "@/actions/member"

interface ImportMembersDialogProps {
    plans: any[]
    onSuccess: () => void
}

interface CSVRow {
    name: string
    email?: string
    mobile: string
    address?: string
    notes?: string
    errors?: string[]
}

export function ImportMembersDialog({ plans, onSuccess }: ImportMembersDialogProps) {
    const { data: session } = useSession()
    const gymId = (session?.user as any)?.gymId
    const [open, setOpen] = useState(false)
    const [importing, setImporting] = useState(false)
    const [rows, setRows] = useState<CSVRow[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string>("")
    const [fileName, setFileName] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<any>) => {
                const parsedRows = results.data.map((row: any) => {
                    const errors = []
                    if (!row.Name && !row.name) errors.push("Name is required")
                    if (!row.Mobile && !row.mobile) errors.push("Mobile is required")

                    return {
                        name: row.Name || row.name || "",
                        email: row.Email || row.email || "",
                        mobile: row.Mobile || row.mobile || "",
                        address: row.Address || row.address || "",
                        notes: row.Notes || row.notes || "",
                        errors: errors.length > 0 ? errors : undefined
                    }
                })
                setRows(parsedRows)
            },
            error: (error: Error) => {
                toast.error(`Error parsing CSV: ${error.message}`)
            }
        })
    }

    const handleImport = async () => {
        if (!gymId || !selectedPlanId || rows.length === 0) {
            toast.error("Please select a plan and upload a valid CSV")
            return
        }

        const validRows = rows.filter(row => !row.errors)
        if (validRows.length === 0) {
            toast.error("No valid rows to import")
            return
        }

        setImporting(true)
        const result = await importMembers(gymId, validRows, selectedPlanId)

        if (result.success) {
            toast.success(result.message)
            setOpen(false)
            resetState()
            onSuccess()
        } else {
            toast.error(result.error)
        }
        setImporting(false)
    }

    const resetState = () => {
        setRows([])
        setFileName("")
        setSelectedPlanId("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const hasErrors = rows.some(row => row.errors && row.errors.length > 0)

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) resetState()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Import Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Members from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with member details. Columns should include: Name, Mobile, Email (optional), Address (optional), Notes (optional).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 overflow-hidden flex-1">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="grid w-full items-center gap-1.5 flex-1">
                            <Label htmlFor="csv-file">CSV File</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="csv-file"
                                    type="file"
                                    accept=".csv"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="cursor-pointer"
                                />
                                {fileName && (
                                    <Button variant="ghost" size="icon" onClick={resetState}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="grid w-full sm:w-60 items-center gap-1.5">
                            <Label>Select Membership Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan._id} value={plan._id}>
                                            {plan.name} ({plan.durationDays} days)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {rows.length > 0 && (
                        <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                            <div className="bg-muted/50 p-2 border-b flex justify-between items-center text-sm">
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        {rows.filter(r => !r.errors).length} Valid
                                    </span>
                                    {hasErrors && (
                                        <span className="flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                            {rows.filter(r => r.errors).length} Invalid
                                        </span>
                                    )}
                                </div>
                                <span className="text-muted-foreground">{rows.length} Total rows</span>
                            </div>
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status/Errors</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, i) => (
                                            <TableRow key={i} className={row.errors ? "bg-destructive/5" : ""}>
                                                <TableCell className="font-medium">{row.name || "-"}</TableCell>
                                                <TableCell>{row.mobile || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">{row.email || "-"}</TableCell>
                                                <TableCell>
                                                    {row.errors ? (
                                                        <div className="flex flex-col gap-1">
                                                            {row.errors.map((err, ei) => (
                                                                <span key={ei} className="text-xs text-destructive flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" /> {err}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Badge variant="success" className="bg-green-500/10 text-green-600 hover:bg-green-500/10">
                                                            Ready
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleImport}
                        disabled={importing || rows.length === 0 || !selectedPlanId || !rows.some(r => !r.errors)}
                    >
                        {importing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" /> Import {rows.filter(r => !r.errors).length} Members
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
