import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface LimitDoc extends BaseDoc {
  item_id: ObjectId;
  count: number;
  type: String;
}

export interface LimitProfileDoc extends LimitDoc {
  type: "limited_profile";
}

export interface LimitPostDoc extends LimitDoc {
  type: "limited_post";
}

abstract class LimitedAbsConcept<T extends LimitDoc> {
  abstract readonly maxLimit: number;
  abstract readonly limited: DocCollection<T>;

  abstract genPartial(item_id: ObjectId, count: number): Partial<T>;

  abstract genFilter(_id: ObjectId): Filter<T>;

  async create(item_id: ObjectId, count: number) {
    if (count > this.maxLimit) {
      throw new NotAllowedError(`Limited item has count ${count} > ${this.maxLimit} (max limit) before initialization.`);
    } else {
      const _id = await this.limited.createOne(this.genPartial(item_id, count));
      return { msg: `Successfully created Limited Item!`, limited: await this.limited.readOne(this.genFilter(_id)) };
    }
  }

  async delete(item_id: ObjectId) {
    await this.limited.deleteOne(this.genFilter(item_id));
    return { msg: `Successfully deleted Limited item w/ id = ${item_id}` };
  }

  async getLimited(item_id: ObjectId) {
    const limited = await this.limited.readOne(this.genFilter(item_id));
    if (!limited) {
      throw new NotFoundError(`No Limited item w/ id = ${item_id}`);
    } else return limited;
  }

  async getCount(item_id: ObjectId) {
    const limited = await this.getLimited(item_id);
    return limited.count;
  }

  underLimit(count: number) {
    return count <= this.maxLimit;
  }

  async increment(item_id: ObjectId, count: number) {
    const newCount = count + (await this.getCount(item_id));
    if (await this.underLimit(newCount)) {
      const partialLimit = this.genPartial(item_id, newCount);
      await this.limited.updateOne(this.genFilter(item_id), partialLimit);
      return { msg: `Successfully incremented Limited item w/ id =${item_id} to ${newCount}` };
    } else {
      throw new NotAllowedError(`Incrementing Limited item w/ id=${item_id} by ${count} results in a count of ${newCount} > ${this.maxLimit}`);
    }
  }

  async reset() {
    await this.limited.deleteMany({});
    return { msg: "Successfully removed all of the 'Limited' items." };
  }
}

export class LimitedProfileConcept extends LimitedAbsConcept<LimitProfileDoc> {
  public readonly maxLimit = 1;
  public readonly limited = new DocCollection<LimitProfileDoc>("limited_profiles");

  genPartial(item_id: ObjectId, count: number): Partial<LimitProfileDoc> {
    return { item_id: item_id, count: count };
  }

  genFilter(_id: ObjectId): Filter<LimitProfileDoc> {
    return { _id };
  }
}

export class LimitedPostConcept extends LimitedAbsConcept<LimitPostDoc> {
  public readonly maxLimit = 200;
  public readonly limited = new DocCollection<LimitPostDoc>("limited_posts");

  genPartial(item_id: ObjectId, count: number): Partial<LimitPostDoc> {
    return { item_id: item_id, count: count };
  }

  genFilter(_id: ObjectId): Filter<LimitPostDoc> {
    return { _id };
  }
}
