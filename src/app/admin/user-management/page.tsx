"use client";
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Minus } from "lucide-react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { ChevronUp, ChevronDown, EyeIcon, EyeOffIcon } from "lucide-react";
import EditUser from "./components/EditUser";
import AddUser from "./components/AddUser";
import DeleteUser from "./components/DeleteUser";
import ArchiveUser from "./components/ArchiveUser";
import useFetchUsers from "./hooks/useFetchUsers";
import { useAuth } from "@/app/AuthContext";
import { useRouter } from "next/navigation";
import SkeletonUserManagement from "./components/SkeletonUserManagement";
import MediaQuery from "react-responsive";

const UserManagement: React.FC = () => {
  interface User {
    id: number;
    username: string;
    role: string;
    manages: string[];
    organizations: string[];
    archived: boolean;
  }

  const roleDisplayValues: { [key: string]: string } = {
    salesperson: "Salesperson",
    manager: "Organization Manager",
    admin: "Admin",
  };
  const orgDisplayValues: { [key: string]: string } = {
    mavn: "MAVN",
    mi: "The Moving Image",
  };

  const { users, error, fetchUsers, loading } = useFetchUsers();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (user?.role !== "system-admin" && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const requestSort = useCallback((key: string) => {
    setSortConfig((prevSortConfig) => {
      if (prevSortConfig && prevSortConfig.key === key) {
        if (prevSortConfig.direction === "ascending") {
          return { key, direction: "descending" };
        } else if (prevSortConfig.direction === "descending") {
          return null;
        }
      }
      return { key, direction: "ascending" };
    });
  }, []);

  const sortedUsers = useMemo(() => {
    const sortableUsers = [...users];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        if (sortConfig.key === "id") {
          return sortConfig.direction === "ascending"
            ? a.id - b.id
            : b.id - a.id;
        } else {
          const valueA = a[sortConfig.key as keyof User];
          const valueB = b[sortConfig.key as keyof User];

          const stringValueA = Array.isArray(valueA)
            ? valueA.length > 0
              ? valueA.join(", ").toLowerCase()
              : "N/A"
            : (valueA as string).toLowerCase();
          const stringValueB = Array.isArray(valueB)
            ? valueB.length > 0
              ? valueB.join(", ").toLowerCase()
              : "N/A"
            : (valueB as string).toLowerCase();

          if (stringValueA < stringValueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (stringValueA > stringValueB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  const getSortIcon = useCallback(
    (key: string) => {
      if (!sortConfig || sortConfig.key !== key) {
        return null;
      }
      if (sortConfig.direction === "ascending") {
        return <ChevronUp className="w-4 h-4 inline text-gray-500" />;
      }
      if (sortConfig.direction === "descending") {
        return <ChevronDown className="w-4 h-4 inline text-gray-500" />;
      }
      return null;
    },
    [sortConfig]
  );

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  }, []);

  const handleAddNewUser = useCallback(() => {
    setIsAddOpen(true);
  }, []);

  const handleDelete = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  }, []);

  const handleArchive = useCallback((user: User) => {
    setSelectedUser(user);
    setIsArchiveOpen(true);
  }, []);

  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }, []);

  const capitalizeFirstWord = useCallback((string: string) => {
    const words = string.split(" ");
    words[0] =
      words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    return words.join(" ");
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tableContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setScrollLeft(tableContainerRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (tableContainerRef.current) {
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      tableContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add loading check at the top of the return
  if (loading && users.length === 0) {
    return (
      <>
        <SkeletonUserManagement />
      </>
    );
  }

  if (error) {
    return (
      <div className="bg-[#E3E6EB] min-h-screen pt-6">
        <div className="flex items-center justify-center flex-grow">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#E3E6EB] min-h-screen">
      <div className="flex flex-col items-center justify-center flex-grow p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
          User Management Table
        </h1>
        <div className="w-full max-w-full px-4 lg:px-6 relative">
          <div className="flex justify-end">
            <button
              className="flex items-center bg-blue-900 text-white px-3 py-2 md:px-4 md:py-2 rounded-2xl hover:bg-blue-950"
              onClick={handleAddNewUser}
            >
              <FaPlus className="mr-2" /> Add New User
            </button>
          </div>
          <div
            className="overflow-x-auto mt-4 rounded-2xl"
            ref={tableContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isDragging ? "grabbing" : "grab",
              transition: "scroll-left 0.3s ease-out",
              userSelect: "none",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-50 sticky top-0 z-30 rounded-t-xl">
                <tr>
                  <th
                    className="px-3 py-2 md:px-6 md:py-3 text-start text-xs sm:text-sm whitespace-nowrap font-bold text-gray-900 uppercase tracking-wider cursor-pointer border-r border-gray-100"
                    onClick={() => requestSort("id")}
                  >
                    <div className="flex items-center">
                      <span>Number</span> {getSortIcon("id")}
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 md:px-6 md:py-3 text-start text-xs sm:text-sm whitespace-nowrap font-bold text-gray-900 uppercase tracking-wider cursor-pointer border-r border-gray-100"
                    onClick={() => requestSort("username")}
                  >
                    <div className="flex items-center">
                      <span>Username</span> {getSortIcon("username")}
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 md:px-6 md:py-3 text-start text-xs sm:text-sm whitespace-nowrap font-bold text-gray-900 uppercase tracking-wider cursor-pointer border-r border-gray-100"
                    onClick={() => requestSort("role")}
                  >
                    <div className="flex items-center">
                      <span>Role</span> {getSortIcon("role")}
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 md:px-6 md:py-3 text-start text-xs sm:text-sm whitespace-nowrap font-bold text-gray-900 uppercase tracking-wider cursor-pointer border-r border-gray-100"
                    onClick={() => requestSort("organizations")}
                  >
                    <div className="flex items-center">
                      <span>Organizations</span> {getSortIcon("organizations")}
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 md:px-6 md:py-3 text-start text-xs sm:text-sm whitespace-nowrap font-bold text-gray-900 uppercase tracking-wider cursor-pointer border-r border-gray-100"
                    onClick={() => requestSort("manages")}
                  >
                    <div className="flex items-center">
                      <span>Team Members</span> {getSortIcon("manages")}
                    </div>
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs sm:text-sm whitespace-nowrap font-bold text-gray-900 uppercase tracking-wider border-r border-gray-100">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 border-b ${
                      index === sortedUsers.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs sm:text-sm whitespace-nowrap border-r border-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs sm:text-sm whitespace-nowrap border-r border-gray-100">
                      {capitalizeFirstLetter(user.username)}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs sm:text-sm whitespace-nowrap border-r border-gray-100">
                      {roleDisplayValues[user.role] || user.role}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs sm:text-sm whitespace-nowrap border-r border-gray-100">
                      {user.role === "admin"
                        ? "All"
                        : user.organizations.length > 0
                        ? user.organizations
                            .map((org) => orgDisplayValues[org] || org)
                            .join(", ")
                        : "N/A"}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs sm:text-sm whitespace-nowrap border-r border-gray-100">
                      {user.role === "admin" ? (
                        "All"
                      ) : user.manages.length > 0 ? (
                        user.manages
                          .map((manage) => capitalizeFirstWord(manage))
                          .join(", ")
                      ) : (
                        <Minus className="w-4 h-4 inline text-gray-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-xs sm:text-sm whitespace-nowrap border-r border-gray-100 flex justify-between">
                      <div className="flex-1 flex justify-start">
                        <button
                          className={`${
                            user.archived ? "text-gray-400" : "text-gray-500"
                          } hover:text-gray-700 px-2 2xl:px-1`}
                          onClick={() => handleArchive(user)}
                        >
                          {user.archived ? (
                            <EyeOffIcon size={16} />
                          ) : (
                            <EyeIcon size={16} />
                          )}
                        </button>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <button
                          className="text-blue-950 hover:text-blue-900 px-2 2xl:px-1"
                          onClick={() => handleEdit(user)}
                        >
                          <FaEdit />
                        </button>
                      </div>
                      <div className="flex-1 flex justify-end">
                        <button
                          className="text-red-500 hover:text-red-700 px-2 2xl:px-1"
                          onClick={() => handleDelete(user)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <EditUser
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          user={selectedUser}
          fetchUsers={fetchUsers}
          allMembers={users
            .filter((u) => u.role !== "admin")
            .map((u) => u.username)}
        />
        <AddUser
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          fetchUsers={fetchUsers}
          allMembers={users
            .filter((u) => u.role !== "admin")
            .map((u) => u.username)}
        />
        <DeleteUser
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          user={selectedUser}
          fetchUsers={fetchUsers}
        />
        <ArchiveUser
          isOpen={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
          user={selectedUser}
          fetchUsers={fetchUsers}
        />
      </div>
    </div>
  );
};
UserManagement.displayName = "UserManagement";

export default UserManagement;
