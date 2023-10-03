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
    return { msg: `User id=${owner} successfuly created a new "${label}" labeled item!` };
  }

  async remove(owner: ObjectId, label: String, item: ObjectId) {
    await this.labels.deleteOne({ owner, label, item });
    return { msg: `User id=${owner} successfuly deleted label "${label}" from an item!` };
  }

  async updateLabel(owner: ObjectId, oldLabel: String, newLabel: String) {
    const updateLabel: Partial<LabelDoc> = { owner, label: newLabel };
    await this.labels.updateMany({ owner, label: oldLabel }, updateLabel);
    return { msg: `User id=${owner} successfully changed all instances of "${oldLabel}" to ${newLabel}` };
  }

  async getUserLabels(owner: ObjectId) {
    const labels = await this.labels.readMany({ owner });
    return new Set(labels.map((labelDoc) => labelDoc.label));
  }

  async getUserLabeledItems(owner: ObjectId, labels: Set<String>) {
    const items = await this.labels.readMany({ owner, label: { $any: labels } });
    return new Set(items.map((labelDoc) => labelDoc.item));
  }
}
