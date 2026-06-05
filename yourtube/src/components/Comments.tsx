import React, { useEffect, useState, ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import axios from "axios";
interface Comment {
  _id: string;
  videoid: string;
  userid: {
    _id: string;
    image?: string;
  };
  commentbody: string;
  usercommented: string;
  commentedon: string;
  userResidentialState: string;
  likes?: string[];
  dislikes?: string[];
}
const Comments: React.FC<{ videoId: string }> = ({ videoId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState<Record<string, string>>({});
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
      loadComments();
  }, [videoId]);

  
  

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div>Loading history...</div>;
  }
  const commentContainsSpecialCharacters = (text: string) => {
    return !/^[\p{L}\p{N}\s.,!?"'()\-:;]+$/u.test(text);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    if (commentContainsSpecialCharacters(newComment)) {
      setCommentError("Comments may not contain special characters.");
      return;
    }

    setCommentError("");
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        userResidentialState: user.residentialState,
      });
      if (res.data.comment) {
        const savedComment = res.data.comment;
        const newCommentObj: Comment = {
          _id: savedComment._id,
          videoid: savedComment.videoid,
          userid: { _id: user._id, image: user.image },
          commentbody: savedComment.commentbody,
          usercommented: savedComment.usercommented || user.name || "Anonymous",
          userResidentialState: savedComment.userResidentialState || user.residentialState || "Unknown",
          commentedon: savedComment.commentedon || new Date().toISOString(),
          likes: savedComment.likes || [],
          dislikes: savedComment.dislikes || [],
        };
        setComments([newCommentObj, ...comments]);
      }
      setNewComment("");
    } catch (error: any) {
      setCommentError(
        error?.response?.data?.message || "Unable to add comment at this time."
      );
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranslate = async (commentId: string, text: string, language: string) => {
    setSelectedLanguages((prev) => ({ ...prev, [commentId]: language }));

    if (!language) return;

    const cached = translations[commentId]?.[language];
    if (cached) return;

    setTranslating((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await axios.post("/api/translate/lang", {
        text,
        language,
      });
      const translatedText = res.data?.translatedText || "";
      setTranslations((prev) => ({
        ...prev,
        [commentId]: { ...(prev[commentId] || {}), [language]: translatedText },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setTranslating((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/like/${commentId}`, {
        userId: user._id,
      });
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== commentId) return c;
          const likes = Array.from(c.likes || []);
          const dislikes = Array.from(c.dislikes || []);
          if (res.data.liked) {
            if (!likes.includes(user._id)) likes.push(user._id);
            return { ...c, likes, dislikes: dislikes.filter((d) => d !== user._id) };
          }
          return { ...c, likes: likes.filter((l) => l !== user._id) };
        })
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/dislike/${commentId}`, {
        userId: user._id,
      });
      if (res.data.deleted) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        return;
      }
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== commentId) return c;
          const likes = Array.from(c.likes || []);
          const dislikes = Array.from(c.dislikes || []);
          if (res.data.disliked) {
            if (!dislikes.includes(user._id)) dislikes.push(user._id);
            return { ...c, dislikes, likes: likes.filter((l) => l !== user._id) };
          }
          return { ...c, dislikes: dislikes.filter((d) => d !== user._id) };
        })
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    if (commentContainsSpecialCharacters(editText)) {
      setCommentError("Comments may not contain special characters.");
      return;
    }
    setCommentError("");
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error: any) {
      setCommentError(
        error?.response?.data?.message || "Unable to update comment at this time."
      );
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                setNewComment(e.target.value);
                if (commentError) setCommentError("");
              }}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            {commentError && (
              <p className="text-sm text-red-600">{commentError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment, idx) => (
            <div key={comment._id} className="flex flex-col sm:flex-row gap-4">
                <Avatar className="w-10 h-10">
                <AvatarImage src={comment.userid.image} />
                <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.usercommented}
                  </span>
                  <span className="text-xs text-gray-500">
                    {comment.userResidentialState}
                  </span>
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleUpdateComment}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    
                    <p className="text-sm">
                      {(() => {
                        const lang = selectedLanguages[comment._id] || "";
                        const isTrans = translating[comment._id] || false;
                        const translated = translations[comment._id]?.[lang];
                        if (!lang) return comment.commentbody;
                        if (isTrans) return "Translating...";
                        return translated || comment.commentbody;
                      })()}
                    </p>
                    {(() => {
                      const lang = selectedLanguages[comment._id] || "";
                      const isTrans = translating[comment._id] || false;
                      const translated = translations[comment._id]?.[lang];
                      return lang && !isTrans && translated ? (
                        <p className="text-xs text-blue-600">Translated</p>
                      ) : null;
                    })()}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <Button
                        variant={comment.likes?.includes(user?._id || "") ? "default" : "ghost"}
                        onClick={() => handleLike(comment._id)}
                        disabled={!user}
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp
                          size={16}
                          className={comment.likes?.includes(user?._id || "") ? "text-blue-600" : "text-gray-500"}
                        />
                        <span className={comment.likes?.includes(user?._id || "") ? "text-blue-600" : "text-gray-500"}>{comment.likes?.length || 0}</span>
                      </Button>
                      <Button
                        variant={comment.dislikes?.includes(user?._id || "") ? "default" : "ghost"}
                        onClick={() => handleDislike(comment._id)}
                        disabled={!user}
                        className="flex items-center gap-1"
                      >
                        <ThumbsDown
                          size={16}
                          className={comment.dislikes?.includes(user?._id || "") ? "text-red-600" : "text-gray-500"}
                        />
                        <span className={comment.dislikes?.includes(user?._id || "") ? "text-red-600" : "text-gray-500"}>{comment.dislikes?.length || 0}</span>
                      </Button>
                      {String(comment.userid?._id || comment.userid) === String(user?._id) && (
                        <div className="flex gap-2 ml-4 text-sm text-gray-500">
                          <button onClick={() => handleEdit(comment)}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(comment._id)}>
                            Delete
                          </button>
                        </div>
                      )}
                      <select
                        value={selectedLanguages[comment._id] || ""}
                        onChange={(e) => {
                          const lang = e.target.value;
                          handleTranslate(comment._id, comment.commentbody, lang);
                        }}
                        className="ml-4 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Default</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                        <option value="kn">Kannada</option>
                        <option value="ml">Malayalam</option>
                        <option value="mr">Marathi</option>
                        <option value="gu">Gujarati</option>
                        <option value="bn">Bengali</option>
                        <option value="pa">Punjabi</option>
                        <option value="ur">Urdu</option>
                        <option value="or">Odia</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
