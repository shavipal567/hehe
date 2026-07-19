import {
  loadGroupMembers,
  insertGroupMember,
  updateGroupMember,
  deleteGroupMember,
} from "../utils/database";

export const groupMemberRepository = {
  async loadAll() {
    return loadGroupMembers();
  },

  async create(member) {
    return insertGroupMember(member);
  },

  async update(id, changes) {
    return updateGroupMember(id, changes);
  },

  async softDelete(id) {
    return deleteGroupMember(id);
  },

  async hardDelete(id) {
    return deleteGroupMember(id);
  },
};
