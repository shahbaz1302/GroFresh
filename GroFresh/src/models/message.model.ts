import mongoose from "mongoose";

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  text: string;
  senderId: mongoose.Types.ObjectId;
  time: string;
}

const messageSchema: mongoose.Schema<IMessage> = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    text: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    time: { type: String },
  },
  { timestamps: true },
);

const messageModel =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

export default messageModel;
