import React from "react";
import UserTag from "./UserTag";

interface User {
  id: number;
  name: string;
}

interface UserAssignment {
  userId: number;
  targetQuantity: number | null;
  targetTime: number | null;
}

interface SelectedUsersSectionProps {
  selectedUsers: UserAssignment[];
  allUsers: User[];
  editingUserId: number | null;
  tempQuantity: string;
  onEditClick: (userId: number, currentQuantity: number | null) => void;
  onSave: (userId: number) => void;
  onTempQuantityChange: (value: string) => void;
  targetType: string | null;
}

const SelectedUsersSection: React.FC<SelectedUsersSectionProps> = ({
  selectedUsers,
  allUsers,
  editingUserId,
  tempQuantity,
  onEditClick,
  onSave,
  onTempQuantityChange,
  targetType,
}) => {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="p-3 border-b border-gray-200 bg-blue-50">
      <h4 className="text-xs font-medium text-blue-900 mb-2">Selected Users</h4>
      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((assignment) => {
          const user = allUsers.find((u) => u.id === assignment.userId);
          if (!user) return null;

          return (
            <UserTag
              key={`selected-${assignment.userId}`}
              userId={assignment.userId}
              name={user.name}
              targetQuantity={assignment.targetQuantity}
              targetTime={assignment.targetTime}
              isEditing={editingUserId === assignment.userId}
              tempQuantity={tempQuantity}
              onEditClick={onEditClick}
              onSave={onSave}
              onTempQuantityChange={onTempQuantityChange}
              targetType={targetType}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SelectedUsersSection);
