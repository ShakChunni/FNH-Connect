"use client";
import React from "react";
import { Edit2, Printer, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { AdmissionPatientData, ADMISSION_STATUS_OPTIONS } from "../../types";

interface PatientTableProps {
  data: AdmissionPatientData[];
  isLoading?: boolean;
  onEdit: (patient: AdmissionPatientData) => void;
  onPrintAdmission: (patient: AdmissionPatientData) => void;
  onPrintFull: (patient: AdmissionPatientData) => void;
}

const getStatusBadge = (status: string) => {
  const option = ADMISSION_STATUS_OPTIONS.find((o) => o.value === status);
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
        colorClasses[option?.color || "blue"] || colorClasses.blue
      }`}
    >
      {option?.label || status}
    </span>
  );
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return `৳${amount.toLocaleString()}`;
};

// Desktop Table
const DesktopTable: React.FC<PatientTableProps> = ({
  data,
  onEdit,
  onPrintAdmission,
  onPrintFull,
}) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Admission #
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Patient
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Department
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Doctor
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Status
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Due
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Admitted
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((patient) => (
          <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-sm font-medium text-blue-600">
                {patient.admissionNumber}
              </span>
            </td>
            <td className="px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.patientFullName}
                </p>
                <p className="text-xs text-gray-500">
                  {patient.patientGender}
                  {patient.patientAge ? `, ${patient.patientAge}y` : ""}
                </p>
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-sm text-gray-700">
                {patient.departmentName}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-sm text-gray-700">
                {patient.doctorName}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              {getStatusBadge(patient.status)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span
                className={`text-sm font-medium ${
                  patient.dueAmount > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatCurrency(patient.dueAmount)}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {formatDate(patient.dateAdmitted)}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEdit(patient)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPrintAdmission(patient)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-colors"
                  title="Print Admission Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPrintFull(patient)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-purple-600 transition-colors"
                  title="Print Full Invoice"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Mobile Card View
const MobileCard: React.FC<{
  patient: AdmissionPatientData;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onPrintAdmission: () => void;
  onPrintFull: () => void;
}> = ({
  patient,
  isExpanded,
  onToggle,
  onEdit,
  onPrintAdmission,
  onPrintFull,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-blue-600">
            {patient.admissionNumber}
          </span>
          {getStatusBadge(patient.status)}
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          {patient.patientFullName}
        </h3>
        <p className="text-sm text-gray-500">
          {patient.departmentName} • Dr. {patient.doctorName}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
      >
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
    </div>

    {isExpanded && (
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Admitted:</span>
            <p className="font-medium">{formatDate(patient.dateAdmitted)}</p>
          </div>
          <div>
            <span className="text-gray-500">Room:</span>
            <p className="font-medium">{patient.seatNumber || "-"}</p>
          </div>
          <div>
            <span className="text-gray-500">Grand Total:</span>
            <p className="font-medium text-green-600">
              {formatCurrency(patient.grandTotal)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Due:</span>
            <p
              className={`font-medium ${
                patient.dueAmount > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(patient.dueAmount)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onPrintAdmission}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-100 text-green-700 rounded-lg font-medium text-sm hover:bg-green-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Receipt
          </button>
          <button
            onClick={onPrintFull}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Invoice
          </button>
        </div>
      </div>
    )}
  </div>
);

const MobileCards: React.FC<PatientTableProps> = ({
  data,
  onEdit,
  onPrintAdmission,
  onPrintFull,
}) => {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  return (
    <div className="md:hidden space-y-3">
      {data.map((patient) => (
        <MobileCard
          key={patient.id}
          patient={patient}
          isExpanded={expandedId === patient.id}
          onToggle={() =>
            setExpandedId(expandedId === patient.id ? null : patient.id)
          }
          onEdit={() => onEdit(patient)}
          onPrintAdmission={() => onPrintAdmission(patient)}
          onPrintFull={() => onPrintFull(patient)}
        />
      ))}
    </div>
  );
};

// Loading Skeleton
const TableSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-gray-100 h-16 rounded-xl animate-pulse" />
    ))}
  </div>
);

// Empty State
const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FileText className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No Admissions Found
    </h3>
    <p className="text-sm text-gray-500">
      Start by clicking &quot;New Admission&quot; to add a patient.
    </p>
  </div>
);

// Main Component
const PatientTable: React.FC<PatientTableProps> = (props) => {
  const { data, isLoading } = props;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <DesktopTable {...props} />
      <MobileCards {...props} />
    </>
  );
};

export default PatientTable;
