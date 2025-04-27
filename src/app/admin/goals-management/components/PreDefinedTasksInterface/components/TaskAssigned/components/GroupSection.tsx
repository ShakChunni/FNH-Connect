import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import GroupTargetEditor from "./GroupTargetEditor";
import UserRow from "./UserRow";

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
  targetTime: number | null;
}

interface GroupSectionProps {
  group: Group;
  selectedUserIds: number[];
  findAssignment: (userId: number) => UserAssignment | undefined;
  isExpanded: boolean;
  isFullySelected: boolean;
  isPartiallySelected: boolean;
  editingUserId: number | null;
  editingGroupName: string | null;
  tempQuantity: string;
  groupTempQuantity: string;
  onToggleGroup: (groupName: string) => void;
  onToggleExpand: (groupName: string) => void;
  onToggleUser: (userId: number) => void;
  onUserEditClick: (userId: number, currentQuantity: number | null) => void;
  onUserSave: (userId: number) => void;
  onGroupEditClick: (groupName: string) => void;
  onGroupSave: (groupName: string) => void;
  onTempQuantityChange: (value: string) => void;
  onGroupTempQuantityChange: (value: string) => void;
  targetType: string | null;
}

const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  selectedUserIds,
  findAssignment,
  isExpanded,
  isFullySelected,
  isPartiallySelected,
  editingUserId,
  editingGroupName,
  tempQuantity,
  groupTempQuantity,
  onToggleGroup,
  onToggleExpand,
  onToggleUser,
  onUserEditClick,
  onUserSave,
  onGroupEditClick,
  onGroupSave,
  onTempQuantityChange,
  onGroupTempQuantityChange,
  targetType,
}) => {
  return (
    <div key={group.name} className="border-b border-gray-100 last:border-b-0">
      <div
        className="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => onToggleExpand(group.name)}
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-blue-950 rounded border-gray-300 focus:ring-blue-950 transition-all duration-200"
            checked={isFullySelected}
            onChange={() => onToggleGroup(group.name)}
            onClick={(e) => e.stopPropagation()}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected;
            }}
          />
          <span className="ml-2 font-medium text-xs sm:text-sm">
            {group.name}
          </span>
        </div>
        <FaChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 text-blue-900 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-gray-50"
          >
            {(isPartiallySelected || isFullySelected) && (
              <GroupTargetEditor
                groupName={group.name}
                isEditing={editingGroupName === group.name}
                tempQuantity={groupTempQuantity}
                onEditClick={onGroupEditClick}
                onSave={onGroupSave}
                onTempQuantityChange={onGroupTempQuantityChange}
                targetType={targetType}
              />
            )}

            {group.users.map((user) => {
              const isUserSelected = selectedUserIds.includes(user.id);
              const assignment = findAssignment(user.id);

              return (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelected={isUserSelected}
                  assignment={assignment}
                  isEditing={editingUserId === user.id}
                  tempQuantity={tempQuantity}
                  onToggle={onToggleUser}
                  onEditClick={onUserEditClick}
                  onSave={onUserSave}
                  onTempQuantityChange={onTempQuantityChange}
                  targetType={targetType}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(GroupSection);
