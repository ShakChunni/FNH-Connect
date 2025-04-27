import React, { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SelectedUsersSection from "./SelectedUsersSection";
import GroupSection from "./GroupSection";

interface DropdownContentProps {
  isOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  dropdownPosition: {
    top: number;
    left: number;
    width: number;
  };
  selectedUsers: any[];
  allUsers: any[];
  groups: any[];
  expandedGroups: string[];
  selectedUserIds: number[];
  editingUserId: number | null;
  editingGroupName: string | null;
  tempQuantity: string;
  groupTempQuantity: string;
  findAssignment: (userId: number) => any;
  toggleGroup: (groupName: string) => void;
  toggleGroupExpand: (groupName: string) => void;
  toggleUser: (userId: number) => void;
  isGroupFullySelected: (groupName: string) => boolean;
  isGroupPartiallySelected: (groupName: string) => boolean;
  handleEditClick: (userId: number, currentQuantity: number | null) => void;
  handleQuantitySave: (userId: number) => void;
  handleGroupEditClick: (groupName: string) => void;
  handleGroupQuantitySave: (groupName: string) => void;
  setTempQuantity: (value: string) => void;
  setGroupTempQuantity: (value: string) => void;
  targetType: string | null;
}

const TaskAssignedDropdown: React.FC<DropdownContentProps> = ({
  isOpen,
  dropdownRef,
  dropdownPosition,
  selectedUsers,
  allUsers,
  groups,
  expandedGroups,
  selectedUserIds,
  editingUserId,
  editingGroupName,
  tempQuantity,
  groupTempQuantity,
  findAssignment,
  toggleGroup,
  toggleGroupExpand,
  toggleUser,
  isGroupFullySelected,
  isGroupPartiallySelected,
  handleEditClick,
  handleQuantitySave,
  handleGroupEditClick,
  handleGroupQuantitySave,
  setTempQuantity,
  setGroupTempQuantity,
  targetType,
}) => {
  const calculateDropdownPosition = useCallback(() => {
    if (!dropdownPosition) return {};

    const viewportHeight = window.innerHeight;
    const dropdownTop = dropdownPosition.top;
    const paddingBottom = 20; // Padding from bottom of viewport
    const availableSpaceBelow = viewportHeight - dropdownTop - paddingBottom;
    
    return {
      top: `${dropdownTop}px`,
      left: window.innerWidth <= 640 ? "16px" : `${dropdownPosition.left}px`,
      maxHeight: `${Math.min(500, availableSpaceBelow)}px`, // Maximum height of 500px
    };
  }, [dropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (dropdownRef.current) {
        const newPosition = calculateDropdownPosition();
        Object.assign(dropdownRef.current.style, {
          top: newPosition.top,
          left: newPosition.left,
          maxHeight: newPosition.maxHeight,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen, calculateDropdownPosition]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 4 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bg-white border border-gray-300 rounded-xl shadow-lg z-[9999] overflow-y-auto 
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{
            ...calculateDropdownPosition(),
            width: window.innerWidth <= 640 
              ? `calc(100vw - 32px)` 
              : `${dropdownPosition.width}px`,
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <div className="divide-y divide-gray-100">
            <div className="p-2"> {/* Added padding container */}
              <SelectedUsersSection
                selectedUsers={selectedUsers}
                allUsers={allUsers}
                editingUserId={editingUserId}
                tempQuantity={tempQuantity}
                onEditClick={handleEditClick}
                onSave={handleQuantitySave}
                onTempQuantityChange={setTempQuantity}
                targetType={targetType}
              />
            </div>

            {groups.map((group) => (
              <div key={group.name} className="p-2"> {/* Added padding container */}
                <GroupSection
                  group={group}
                  selectedUserIds={selectedUserIds}
                  findAssignment={findAssignment}
                  isExpanded={expandedGroups.includes(group.name)}
                  isFullySelected={isGroupFullySelected(group.name)}
                  isPartiallySelected={isGroupPartiallySelected(group.name)}
                  editingUserId={editingUserId}
                  editingGroupName={editingGroupName}
                  tempQuantity={tempQuantity}
                  groupTempQuantity={groupTempQuantity}
                  onToggleGroup={toggleGroup}
                  onToggleExpand={toggleGroupExpand}
                  onToggleUser={toggleUser}
                  onUserEditClick={handleEditClick}
                  onUserSave={handleQuantitySave}
                  onGroupEditClick={handleGroupEditClick}
                  onGroupSave={handleGroupQuantitySave}
                  onTempQuantityChange={setTempQuantity}
                  onGroupTempQuantityChange={setGroupTempQuantity}
                  targetType={targetType}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(TaskAssignedDropdown);

