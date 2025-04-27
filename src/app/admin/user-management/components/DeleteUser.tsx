import React, { useRef, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import useDeleteUsers from "../hooks/useDeleteUsers";
import Notification from "./Notification";

interface DeleteUserProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    username: string;
    role: string;
    manages: string[];
  } | null;
  fetchUsers: () => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({
  isOpen,
  onClose,
  user,
  fetchUsers,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const lastClickTimestamp = useRef<number>(0);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { deleteUser, isLoading, error } = useDeleteUsers();

  const handleDelete = useCallback(async () => {
    if (user) {
      await deleteUser(user.id);
      if (!error) {
        setNotification({
          message: "User deleted successfully",
          type: "success",
        });
        fetchUsers();
        onClose();
      } else {
        setNotification({ message: "Failed to delete user", type: "error" });
        console.error("Failed to delete user:", error);
      }
    }
  }, [user, deleteUser, error, fetchUsers, onClose]);

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
        onClose();
      }
    },
    [onClose]
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

  const { username } = user || {};

  return (
    <>
      <AnimatePresence>
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
          >
            <motion.div
              ref={popupRef}
              className="bg-white rounded-xl shadow-lg p-6 w-[90%] md:w-[60%] lg:w-[40%] h-auto min-h-[20%] max-h-[40%]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.3, ease: "easeInOut" },
              }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
              >
                <FaTimes size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-4 text-red-800">
                Delete User
              </h2>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-bold">{username}</span> from the Users
                table?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-red-500 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-xl"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`bg-blue-900 hover:bg-blue-950 text-white font-bold py-2 px-4 rounded-xl ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  Yes
                </button>
              </div>
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

export default DeleteUser;