import FriendConcept from "./concepts/friend";
import LabelConcept from "./concepts/labels";
import { LimitedPostConcept, LimitedProfileConcept } from "./concepts/limit";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const Friend = new FriendConcept();
export const Label = new LabelConcept();
export const LimitedPost = new LimitedPostConcept();
export const LimitedProfile = new LimitedProfileConcept();
export const Post = new PostConcept();
export const Profile = new ProfileConcept();
export const User = new UserConcept();
export const WebSession = new WebSessionConcept();
