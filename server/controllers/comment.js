import comment from "../Modals/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  const postcomment = new comment(commentdata);
  try {
    await postcomment.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid }).populate("userid", "image");
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likeComment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const comm = await comment.findById(_id);
    if (!comm) return res.status(404).send("comment unavailable");

    const hasLiked = comm.likes.some((u) => u.toString() === userId);
    if (hasLiked) {
      await comment.findByIdAndUpdate(_id, { $pull: { likes: userId } });
      return res.status(200).json({ liked: false });
    }

    // remove dislike if exists, then add like
    await comment.findByIdAndUpdate(_id, {
      $pull: { dislikes: userId },
      $addToSet: { likes: userId },
    });
    return res.status(200).json({ liked: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikeComment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const comm = await comment.findById(_id);
    if (!comm) return res.status(404).send("comment unavailable");

    const hasDisliked = comm.dislikes.some((u) => u.toString() === userId);
    if (hasDisliked) {
      await comment.findByIdAndUpdate(_id, { $pull: { dislikes: userId } });
      return res.status(200).json({ disliked: false, deleted: false });
    }

    const updatedComment = await comment.findByIdAndUpdate(
      _id,
      {
        $pull: { likes: userId },
        $addToSet: { dislikes: userId },
      },
      { new: true }
    );

    if (updatedComment.dislikes.length >= 2) {
      await comment.findByIdAndDelete(_id);
      return res.status(200).json({ disliked: true, deleted: true });
    }

    return res.status(200).json({ disliked: true, deleted: false });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
