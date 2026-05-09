export interface GroupMemberPermission {
  user: string;
  permissions: string[];
}

export interface Group {
  _id: string;
  title: string;
  description: string;
  groupImg?: string;
  groupImgId?: string;
  createdBy?: string;
  admins?: string[];
  members?: string[];
  memberPermissions?: GroupMemberPermission[];
  createdAt?: string;
  updatedAt?: string;
}
