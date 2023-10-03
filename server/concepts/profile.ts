import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FollowersDoc extends BaseDoc {
  user: ObjectId;
  follows: ObjectId;
}

export interface ProfileDoc extends BaseDoc {
  user: ObjectId;
  handle: String;
  timeActive: number;
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");
  public readonly following = new DocCollection<FollowersDoc>("following");

  async create(user: ObjectId, handle: String) {
    if (await this.profiles.readOne({ user })) {
      throw new NotAllowedError(`A profile associated with id=${user} already exists!`);
    }
    const _id = await this.profiles.createOne({ user, handle, timeActive: 0 });
    return { msg: "Profile created successfully!", profile: await this.profiles.readOne({ _id }) };
  }

  async delete(user: ObjectId) {
    await this.profiles.deleteOne({ user });
    return { msg: `Profile id=${user} deleted successfully!` };
  }

  async getProfile(user: ObjectId) {
    return await this.profiles.readOne({ user });
  }

  async getFollowed(user: ObjectId) {
    return await this.following.readMany({ user: user });
  }

  async followAccount(user: ObjectId, follows: ObjectId) {
    await this.following.createOne({ user, follows });
    return { msg: `Profile id=${user} successfully FOLLOWED Profile id=${follows}` };
  }

  async unfollowAccount(user: ObjectId, follows: ObjectId) {
    await this.following.deleteOne({ user, follows });
    return { msg: `Profile id=${user} successfully UNFOLLOWED Profile id=${follows}` };
  }

  async changeHandle(user: ObjectId, newHandle: String) {
    const updatedHandle: Partial<ProfileDoc> = { handle: newHandle };
    await this.profiles.updateOne({ user }, updatedHandle);
  }

  async getTimeActive(user: ObjectId) {
    const profile = await this.getProfile(user);
    if (!profile) {
      throw new NotFoundError(`No Profile is currently associated with id=${user}`);
    }
    return profile?.timeActive;
  }

  async addTimeActive(user: ObjectId, time: number) {
    const aggregateTime = (await this.getTimeActive(user)) + time;
    const updatedTime: Partial<ProfileDoc> = { timeActive: aggregateTime };
    await this.profiles.updateOne({ user }, updatedTime);
  }
}
