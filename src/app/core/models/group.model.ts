export interface GroupMemberPermission {
  user: string;
  permissions: string[];
}

export interface GroupMemberRef {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
}

export interface Group {
  _id: string;
  title: string;
  description: string;
  groupImg?: string;
  groupImgId?: string;
  createdBy?: string;
  admins?: string[];
  members?: Array<string | GroupMemberRef>;
  memberPermissions?: GroupMemberPermission[];
  createdAt?: string;
  updatedAt?: string;
}
