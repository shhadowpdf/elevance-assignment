import mongoose from "mongoose";
const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
      likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      ],
      dislikes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      ],
    commentedon: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
