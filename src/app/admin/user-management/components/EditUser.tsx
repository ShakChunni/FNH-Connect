import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RoleDropdown from "./Dropdowns/RoleDropdown";
import AssignTeamMembers from "./Dropdowns/AssignTeamMembersDropdown";
import AssignOrganizationDropdown from "./Dropdowns/AssignOrganizationDropdown";
import { FaEye, FaEyeSlash, FaCopy, FaCheck, FaTimes } from "react-icons/fa";
import useUpdateUsers from "../hooks/useUpdateUsers";
import Notification from "./Notification";

interface EditUserProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    username: string;
    role: string;
    manages: string[];
    organizations: string[];
  } | null;
  fetchUsers: () => void;
  allMembers: string[];
}

const EditUser: React.FC<EditUserProps> = ({
  isOpen,
  onClose,
  user,
  fetchUsers,
  allMembers,
}) => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usernameChanged, setUsernameChanged] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [isUsernameCopied, setIsUsernameCopied] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [initialTeamMembers, setInitialTeamMembers] = useState<string[]>([]);
  const [teamMembersChanged, setTeamMembersChanged] = useState(false);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [initialOrganizations, setInitialOrganizations] = useState<string[]>(
    []
  );
  const [organizationChanged, setOrganizationChanged] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const lastClickTimestamp = useRef<number>(0);

  const { updateUser, isLoading, error } = useUpdateUsers();

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      setRole(user.role);
      setTeamMembers(user.manages || []);
      setInitialTeamMembers(user.manages || []);
      setOrganizations(user.organizations || []);
      setInitialOrganizations(user.organizations || []);
    }
  }, [isOpen, user]);

  const handleSubmit = async () => {
    if (user) {
      const updateData: any = {
        id: user.id,
        username,
        role,
        password: password || undefined,
        manages: role === "salesperson" ? teamMembers : [],
        organizations:
          role === "salesperson" || role === "manager" ? organizations : [],
      };

      console.log("updateData", updateData);

      await updateUser(updateData);

      if (!error) {
        setNotification({
          message: "User updated successfully",
          type: "success",
        });
        fetchUsers();
      } else {
        setNotification({ message: "Failed to update user", type: "error" });
      }
      handleClose();
    }
  };

  const handleClose = () => {
    setUsername("");
    setRole("");
    setPassword("");
    setUsernameChanged(false);
    setPasswordChanged(false);
    setTeamMembers([]);
    setInitialTeamMembers([]);
    setOrganizations([]);
    setInitialOrganizations([]);
    onClose();
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const currentTimestamp = Date.now();

      if (currentTimestamp - lastClickTimestamp.current < 50) {
        return;
      }

      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else {
          handleClose();
        }
      }
    },
    [isDropdownOpen]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleDropdownToggle = useCallback((isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    lastClickTimestamp.current = Date.now();
  }, []);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(password).then(() => {
      setIsPasswordCopied(true);
      setTimeout(() => setIsPasswordCopied(false), 2000);
    });
  };

  const copyUsernameToClipboard = () => {
    navigator.clipboard.writeText(username).then(() => {
      setIsUsernameCopied(true);
      setTimeout(() => setIsUsernameCopied(false), 2000);
    });
  };

  const handleTeamMembersChange = (selectedValues: string[]) => {
    setTeamMembers(selectedValues);
    setTeamMembersChanged(
      JSON.stringify(selectedValues) !== JSON.stringify(initialTeamMembers)
    );
  };

  const handleOrganizationChange = (selectedValues: string[]) => {
    setOrganizations(selectedValues);
    setOrganizationChanged(
      JSON.stringify(selectedValues) !== JSON.stringify(initialOrganizations)
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            transition={{ duration: 0.2 }}
            layout
          >
            <motion.div
              ref={popupRef}
              className="bg-white rounded-lg shadow-lg p-6 w-[90%] md:w-[60%] lg:w-[40%] h-auto min-h-[40%] max-h-[80%] relative overflow-y-auto sm:overflow-visible"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.5, ease: "easeInOut" },
              }}
              transition={{ duration: 0.2 }}
              layout
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
              >
                <FaTimes size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-800">
                Edit User
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameChanged(e.target.value !== user?.username);
                      }}
                      className={`text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-700 focus:ring-2 focus:ring-blue-700 outline-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-white border-2 ${
                        usernameChanged ? "border-green-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={copyUsernameToClipboard}
                      className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400"
                    >
                      {isUsernameCopied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isUsernameCopied ? "h-6" : "h-0"
                    } overflow-hidden`}
                  >
                    <p className="text-green-500 text-sm mt-1">
                      Username copied to clipboard!
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Role
                  </label>
                  <RoleDropdown
                    onSelect={(value) => setRole(value)}
                    defaultValue={role}
                    onDropdownToggle={handleDropdownToggle}
                    onDropdownOpenStateChange={handleDropdownToggle}
                    hasChanged={role !== user?.role}
                  />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div layout>
                    {(role === "manager" || role === "salesperson") && (
                      <motion.div
                        key="organization"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        layout
                        style={{
                          zIndex: 102,
                          position: "relative",
                        }}
                      >
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Assign Organization
                        </label>
                        <AssignOrganizationDropdown
                          onSelect={handleOrganizationChange}
                          defaultValue={organizations}
                          role={role}
                          username={username}
                          onDropdownToggle={handleDropdownToggle}
                          onDropdownOpenStateChange={handleDropdownToggle}
                          hasChanged={organizationChanged}
                        />
                      </motion.div>
                    )}
                    {role === "salesperson" && (
                      <motion.div
                        key="team-members"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        layout
                        style={{
                          zIndex: 101, // Ensure this is higher than the main popup
                          position: "relative",
                          marginTop: "1rem",
                        }}
                      >
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Assign Team Members
                        </label>
                        <AssignTeamMembers
                          onSelect={handleTeamMembersChange}
                          defaultValue={teamMembers}
                          role={role}
                          username={username}
                          onDropdownToggle={handleDropdownToggle}
                          onDropdownOpenStateChange={handleDropdownToggle}
                          hasChanged={teamMembersChanged}
                          allMembers={allMembers}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Update Password
                  </label>
                  <div className="relative">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                      placeholder="Enter new password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordChanged(e.target.value !== "");
                      }}
                      className={`text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-700 focus:ring-2 focus:ring-blue-700 outline-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-white border-2 ${
                        passwordChanged ? "border-green-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-10 flex items-center px-2 text-gray-400"
                    >
                      {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400"
                    >
                      {isPasswordCopied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isPasswordCopied ? "h-6" : "h-0"
                    } overflow-hidden`}
                  >
                    <p className="text-green-500 text-sm mt-1">
                      Password copied to clipboard!
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="dot-1"></span>
                        <span className="dot-2"></span>
                        <span className="dot-3"></span>
                      </span>
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default EditUser;
