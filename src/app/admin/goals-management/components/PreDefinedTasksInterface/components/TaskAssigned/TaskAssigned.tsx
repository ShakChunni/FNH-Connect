import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";
import TaskAssignedDropdown from "./components/TaskAssignedDropdown";

interface User {
  id: number;
  name: string;
}

interface Group {
  name: string;
  users: User[];
}

interface UserAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null; // Add this field
}

interface TaskAssignedProps {
  selectedUsers: UserAssignment[];
  onSelect: (assignments: UserAssignment[]) => void;
  error?: string | null;
  targetType: string | null;
}

const TaskAssigned: React.FC<TaskAssignedProps> = ({
  selectedUsers,
  onSelect,
  error,
  targetType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>("");
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [groupTempQuantity, setGroupTempQuantity] = useState<string>("");

  const selectedUserIds = useMemo(
    () => selectedUsers.map((assignment) => assignment.userId),
    [selectedUsers]
  );

  const groups: Group[] = useMemo(
    () => [
      {
        name: "Admins",
        users: [
          { id: 1, name: "Ashfaq WCT" },
          { id: 2, name: "Jouya TMI" },
          {
            id: 5,
            name: "Tanvir TMI",
          },
        ],
      },
      {
        name: "Full-Timers",
        users: [
          { id: 6, name: "Amra MAVN" },
          { id: 9, name: "Russell TMI" },
          { id: 8, name: "Nana MAVN" },
          { id: 47, name: "Nigel TMI" },
        ],
      },
      {
        name: "Interns",
        users: [
          { id: 45, name: "Felix TMI" },
          { id: 44, name: "Marwan MAVN" },
          { id: 43, name: "Amelie TMI" },
          { id: 10, name: "Ryuto TMI" },
          { id: 42, name: "Manon MAVN" },
          { id: 7, name: "Charlotte MAVN" },
        ],
      },
    ],
    []
  );

  const allUsers = useMemo(
    () => groups.flatMap((group) => group.users),
    [groups]
  );

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !buttonRef.current?.contains(event.target as Node)
    ) {
      setIsOpen(false);
      setEditingUserId(null);
      setEditingGroupName(null);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const findAssignment = useCallback(
    (userId: number) => {
      return selectedUsers.find((assignment) => assignment.userId === userId);
    },
    [selectedUsers]
  );

  const toggleUser = useCallback(
    (userId: number) => {
      const isSelected = selectedUserIds.includes(userId);

      if (isSelected) {
        onSelect(
          selectedUsers.filter((assignment) => assignment.userId !== userId)
        );
      } else {
        onSelect([
          ...selectedUsers,
          {
            userId,
            targetQuantity: targetType === "QUANTITY" ? null : null,
            targetTime: targetType === "TIME" ? null : null,
          },
        ]);
      }
    },
    [selectedUserIds, selectedUsers, onSelect, targetType]
  );

  const updateUserTarget = useCallback(
    (userId: number, value: number | null) => {
      onSelect(
        selectedUsers.map((assignment) =>
          assignment.userId === userId
            ? {
                ...assignment,
                targetQuantity: targetType === "QUANTITY" ? value : null,
                targetTime: targetType === "TIME" ? value : null,
              }
            : assignment
        )
      );
    },
    [selectedUsers, onSelect, targetType]
  );

  const toggleGroup = useCallback(
    (groupName: string, toggleSelection = true) => {
      if (toggleSelection) {
        const group = groups.find((g) => g.name === groupName);
        if (!group) return;

        const groupUserIds = group.users.map((user) => user.id);

        const allSelected = groupUserIds.every((id) =>
          selectedUserIds.includes(id)
        );

        if (allSelected) {
          onSelect(
            selectedUsers.filter(
              (assignment) => !groupUserIds.includes(assignment.userId)
            )
          );
        } else {
          const missingUserIds = groupUserIds.filter(
            (id) => !selectedUserIds.includes(id)
          );
          const newAssignments = missingUserIds.map((userId) => ({
            userId,
            targetQuantity: targetType === "QUANTITY" ? null : null,
            targetTime: targetType === "TIME" ? null : null,
          }));
          onSelect([...selectedUsers, ...newAssignments]);
        }
      }
    },
    [groups, selectedUserIds, selectedUsers, onSelect, targetType]
  );

  const toggleGroupExpand = useCallback((groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  }, []);

  const isGroupFullySelected = useCallback(
    (groupName: string) => {
      const group = groups.find((g) => g.name === groupName);
      if (!group) return false;
      return group.users.every((user) => selectedUserIds.includes(user.id));
    },
    [groups, selectedUserIds]
  );

  const isGroupPartiallySelected = useCallback(
    (groupName: string) => {
      const group = groups.find((g) => g.name === groupName);
      if (!group) return false;
      return (
        group.users.some((user) => selectedUserIds.includes(user.id)) &&
        !group.users.every((user) => selectedUserIds.includes(user.id))
      );
    },
    [groups, selectedUserIds]
  );

  const getSelectedUsersText = useCallback(() => {
    if (selectedUsers.length === 0) return "";

    if (selectedUsers.length > 2) {
      const firstUser = allUsers.find(
        (user) => user.id === selectedUsers[0].userId
      );
      return `${firstUser?.name} and ${selectedUsers.length - 1} more`;
    }

    return selectedUsers
      .map(
        (assignment) =>
          allUsers.find((user) => user.id === assignment.userId)?.name
      )
      .filter(Boolean)
      .join(", ");
  }, [selectedUsers, allUsers]);

  const handleEditClick = useCallback(
    (userId: number, currentQuantity: number | null) => {
      setEditingUserId(userId);
      setTempQuantity(currentQuantity?.toString() || "");
      setEditingGroupName(null);
    },
    []
  );

  const handleQuantitySave = useCallback(
    (userId: number) => {
      const newValue =
        tempQuantity.trim() === "" ? null : parseInt(tempQuantity, 10);
      updateUserTarget(userId, newValue);
      setEditingUserId(null);
    },
    [tempQuantity, updateUserTarget]
  );

  const handleGroupEditClick = useCallback(
    (groupName: string) => {
      const group = groups.find((g) => g.name === groupName);
      if (!group) return;

      const selectedGroupUsers = group.users.filter((user) =>
        selectedUserIds.includes(user.id)
      );

      const groupAssignments = selectedGroupUsers
        .map((user) => findAssignment(user.id))
        .filter(Boolean) as UserAssignment[];

      let initialValue = "";
      if (groupAssignments.length > 0) {
        const nonNullTargets = groupAssignments
          .map((a) => a.targetQuantity)
          .filter((q) => q !== null);

        if (nonNullTargets.length > 0) {
          initialValue = String(nonNullTargets[0]);
        }
      }

      setEditingGroupName(groupName);
      setGroupTempQuantity(initialValue);
      setEditingUserId(null);
    },
    [groups, selectedUserIds, findAssignment]
  );

  const handleGroupQuantitySave = useCallback(
    (groupName: string) => {
      const group = groups.find((g) => g.name === groupName);
      if (!group) return;

      const newValue =
        groupTempQuantity.trim() === ""
          ? null
          : parseInt(groupTempQuantity, 10);

      const groupUserIds = group.users.map((user) => user.id);

      const updatedAssignments = selectedUsers.map((assignment) =>
        groupUserIds.includes(assignment.userId)
          ? {
              ...assignment,
              targetQuantity: targetType === "QUANTITY" ? newValue : null,
              targetTime: targetType === "TIME" ? newValue : null,
            }
          : assignment
      );

      onSelect(updatedAssignments);
      setEditingGroupName(null);
    },
    [groupTempQuantity, groups, selectedUsers, onSelect, targetType]
  );

  const getButtonClassName = useMemo(() => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-xl flex justify-between items-center w-full cursor-pointer px-4 py-2 sm:py-3 h-12 sm:h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (selectedUsers.length > 0) {
      return `bg-white border-2 border-green-500 ${baseClasses}`;
    } else if (error) {
      return `bg-white border-2 border-red-500 ${baseClasses}`;
    } else {
      return `bg-[#F0F4F8] border border-gray-300 ${baseClasses}`;
    }
  }, [selectedUsers.length, error]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4">
      <strong className="text-black w-full sm:w-32 text-sm sm:text-base">
        Task Assigned:
      </strong>
      <div className="relative flex-1 p-1">
        <button
          ref={buttonRef}
          className={getButtonClassName}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span
            className={`${
              selectedUsers.length === 0 && !error ? "text-gray-400" : ""
            } truncate text-sm`}
          >
            {getSelectedUsersText() || error || "Select Assignees"}
          </span>
          <FaChevronDown
            className={`min-w-4 w-4 h-4 text-blue-900 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {createPortal(
          <TaskAssignedDropdown
            isOpen={isOpen}
            dropdownRef={dropdownRef}
            dropdownPosition={dropdownPosition}
            selectedUsers={selectedUsers}
            allUsers={allUsers}
            groups={groups}
            expandedGroups={expandedGroups}
            selectedUserIds={selectedUserIds}
            editingUserId={editingUserId}
            editingGroupName={editingGroupName}
            tempQuantity={tempQuantity}
            groupTempQuantity={groupTempQuantity}
            findAssignment={findAssignment}
            toggleGroup={toggleGroup}
            toggleGroupExpand={toggleGroupExpand}
            toggleUser={toggleUser}
            isGroupFullySelected={isGroupFullySelected}
            isGroupPartiallySelected={isGroupPartiallySelected}
            handleEditClick={handleEditClick}
            handleQuantitySave={handleQuantitySave}
            handleGroupEditClick={handleGroupEditClick}
            handleGroupQuantitySave={handleGroupQuantitySave}
            setTempQuantity={setTempQuantity}
            setGroupTempQuantity={setGroupTempQuantity}
            targetType={targetType}
          />,
          document.body
        )}
      </div>
    </div>
  );
};

export default React.memo(TaskAssigned);
