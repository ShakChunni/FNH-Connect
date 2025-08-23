import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { MinusIcon } from "lucide-react";

const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="hover:bg-gray-100">
      <td className="px-6 py-4 whitespace-nowrap font-semibold border-r border-gray-200 cursor-pointer md:sticky md:left-0 md:bg-gray-100 md:z-20">
        <div className="flex items-center">
          <Skeleton width={20} height={20} circle className="mr-2" />
          <Skeleton width={30} height={16} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 cursor-pointer group md:sticky md:bg-gray-100 md:z-20">
        <div className="flex items-center justify-between">
          <Skeleton width={120} height={16} />
          <div className="opacity-0 group-hover:opacity-100">
            <Skeleton width={16} height={16} circle />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={100} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={100} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={120} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={100} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={100} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={80} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={90} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={90} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={70} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <div className="flex justify-center">
          <Skeleton width={24} height={24} circle />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={90} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <div className="flex justify-center">
          <Skeleton width={24} height={24} circle />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={90} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <div className="flex justify-center">
          <Skeleton width={24} height={24} circle />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={90} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <div className="flex justify-center">
          <Skeleton width={24} height={24} circle />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={90} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={80} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <div className="flex justify-center">
          <Skeleton width={24} height={24} circle />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={60} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={100} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={120} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={120} height={16} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
        <Skeleton width={60} height={16} />
      </td>
    </tr>
  );
};

export default TableRowSkeleton;
