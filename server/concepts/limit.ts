import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

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
    if (await this.limited.readOne(this.genFilter(item_id))) {
      throw new NotAllowedError("This item is already Limited!");
    } else if (count > this.maxLimit) {
      throw new NotAllowedError(`Limited item has count ${count} > ${this.maxLimit} (max limit) before initialization.`);
    } else {
      const _id = await this.limited.createOne(this.genPartial(item_id, count));
      return { msg: `Successfully created Limited Item!`, limited: await this.limited.readOne(this.genFilter(_id)) };
    }
  }

  async delete(item_id: ObjectId) {
    await this.limited.deleteOne(this.genFilter(item_id));
    return { msg: `Successfully deleted Limited item` };
  }

  async getLimited(item_id: ObjectId) {
    return await this.limited.readOne(this.genFilter(item_id));
  }

  async getCount(item_id: ObjectId) {
    const limited = await this.getLimited(item_id);
    return limited!.count;
  }

  underLimit(count: number) {
    return count <= this.maxLimit;
  }

  async updateCount(item_id: ObjectId, count: number) {
    if (this.underLimit(count)) {
      const partialLimit = this.genPartial(item_id, count);
      await this.limited.updateOne(this.genFilter(item_id), partialLimit);
      return { msg: `Successfully changed count of Limited item w/ to ${count}` };
    } else {
      throw new NotAllowedError(`Changing count of Limited item results in a count of ${count} > ${this.maxLimit}`);
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
    return { item_id: item_id, count: count, type: "limited_profile" };
  }

  genFilter(item_id: ObjectId): Filter<LimitProfileDoc> {
    return { item_id };
  }
}

export class LimitedPostConcept extends LimitedAbsConcept<LimitPostDoc> {
  public readonly maxLimit = 200;
  public readonly limited = new DocCollection<LimitPostDoc>("limited_posts");

  genPartial(item_id: ObjectId, count: number): Partial<LimitPostDoc> {
    return { item_id: item_id, count: count, type: "limited_post" };
  }

  genFilter(item_id: ObjectId): Filter<LimitPostDoc> {
    return { item_id };
  }
}
