import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import useArchiveUsers from "../hooks/useArchiveUsers";
import Notification from "./Notification";

interface ArchiveUserProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    username: string;
    role: string;
    manages: string[];
    archived: boolean;
  } | null;
  fetchUsers: () => void;
}

const ArchiveUser: React.FC<ArchiveUserProps> = ({
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

  const { archiveUser, isLoading, error } = useArchiveUsers();

  const handleArchive = useCallback(async () => {
    if (user) {
      await archiveUser(user.id, !user.archived);
      if (!error) {
        setNotification({
          message: "User archive status updated successfully",
          type: "success",
        });
        fetchUsers();
        onClose();
      } else {
        setNotification({
          message: "Failed to update user archive status",
          type: "error",
        });
        console.error("Failed to update user archive status:", error);
      }
    }
  }, [user, archiveUser, error, fetchUsers, onClose]);

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

  const { id, username, archived } = user || {};

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
              <h2 className="text-2xl font-bold mb-4 text-blue-950">
                Archive User
              </h2>
              <p className="text-gray-700 mb-4">
                Are you sure you want to {archived ? "unarchive" : "archive"}{" "}
                <span className="font-bold">{username}</span>?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
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

export default ArchiveUser;
