import React, { useState, useRef } from "react";
import { MinusIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface InfertilityPatientData {
  id: number;
  hospitalName: string | null;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientAge: number | null;
  patientDOB: string | null;
  husbandName: string | null;
  husbandAge: number | null;
  husbandDOB: string | null;
  mobileNumber: string | null;
  address: string | null;
  yearsMarried: number | null;
  yearsTrying: number | null;
  para: string | null;
  alc: string | null;
  weight: number | null;
  bp: string | null;
  infertilityType: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TableRowProps {
  row: InfertilityPatientData;
  formatDate: (date: string | null) => string;
  index: number;
}

const TableRow: React.FC<TableRowProps> = ({ row, formatDate, index }) => {
  const [showFullNote, setShowFullNote] = useState(false);
  const [noteHoverTimeout, setNoteHoverTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const noteCellRef = useRef<HTMLTableDataCellElement>(null);

  const handleNoteMouseEnter = () => {
    if (noteHoverTimeout) {
      clearTimeout(noteHoverTimeout);
      setNoteHoverTimeout(null);
    }
    setShowFullNote(true);
  };

  const handleNoteMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowFullNote(false);
    }, 100);
    setNoteHoverTimeout(timeout);
  };

  const handleTooltipMouseEnter = () => {
    if (noteHoverTimeout) {
      clearTimeout(noteHoverTimeout);
      setNoteHoverTimeout(null);
    }
  };

  const handleTooltipMouseLeave = () => {
    setShowFullNote(false);
  };

  const truncateNote = (note: string, maxLength: number = 50) => {
    if (!note) return "";
    if (note.length <= maxLength) return note;
    return `${note.substring(0, maxLength)}...`;
  };

  const renderCell = (value: any, placeholder = true) => {
    if (value === null || value === undefined || value === "") {
      return placeholder ? (
        <div className="flex justify-center">
          <MinusIcon className="inline w-3.5 h-3.5 text-gray-400" />
        </div>
      ) : null;
    }
    return <span>{value}</span>;
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-all duration-200">
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs font-semibold text-gray-700">
          {index}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.hospitalName)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.patientFullName)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.patientAge)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {row.patientDOB ? formatDate(row.patientDOB) : renderCell(null)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.husbandName)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.husbandAge)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {row.husbandDOB ? formatDate(row.husbandDOB) : renderCell(null)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.mobileNumber)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.address)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.yearsMarried)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.yearsTrying)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.para)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.alc)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.weight)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.bp)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {renderCell(row.infertilityType)}
        </td>
        {/* Notes with tooltip */}
        <td
          ref={noteCellRef}
          className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs relative"
          onMouseEnter={handleNoteMouseEnter}
          onMouseLeave={handleNoteMouseLeave}
        >
          {row.notes ? (
            <span className="cursor-help">{truncateNote(row.notes)}</span>
          ) : (
            renderCell(null)
          )}
          <AnimatePresence>
            {showFullNote && row.notes && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 p-4 bg-white border border-gray-200 rounded-md shadow-2xl break-words whitespace-normal"
                style={{
                  top: "-8px",
                  left: "0",
                  minWidth: noteCellRef.current
                    ? noteCellRef.current.offsetWidth
                    : "auto",
                  maxWidth: "300px",
                }}
                onMouseEnter={handleTooltipMouseEnter}
                onMouseLeave={handleTooltipMouseLeave}
              >
                {row.notes}
              </motion.div>
            )}
          </AnimatePresence>
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 text-xs">
          {row.createdAt ? formatDate(row.createdAt) : renderCell(null)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap border-gray-100 text-xs">
          {row.updatedAt ? formatDate(row.updatedAt) : renderCell(null)}
        </td>
      </tr>
    </>
  );
};

export default React.memo(TableRow);
