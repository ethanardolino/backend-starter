import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface LabelDoc extends BaseDoc {
  owner: ObjectId;
  label: String;
  item: ObjectId;
}

export default class LabelConcept {
  public readonly labels = new DocCollection<LabelDoc>("labels");

  async create(owner: ObjectId, label: String, item: ObjectId) {
    await this.labels.createOne({ owner, label, item });
    return { msg: `Successfuly created a new '${label}' labeled item!` };
  }

  async remove(owner: ObjectId, label: String, item: ObjectId) {
    await this.labels.deleteOne({ owner, label, item });
    return { msg: `Successfuly deleted label '${label}' from an item!` };
  }

  async updateLabel(owner: ObjectId, oldLabel: String, newLabel: String) {
    const updateLabel: Partial<LabelDoc> = { owner, label: newLabel };
    await this.labels.updateMany({ owner, label: oldLabel }, updateLabel);
    return { msg: `Successfully changed all instances of '${oldLabel}' to ${newLabel}` };
  }

  async getLabels(owner: ObjectId, item?: ObjectId) {
    const query = item ? { owner, item } : { owner };
    return (await this.labels.readMany(query)).map((labelDoc) => labelDoc.label);
  }

  async getUserLabeledItems(owner: ObjectId, label?: String) {
    const query = label ? { owner, label } : { owner };
    return await this.labels.readMany(query);
  }
}
