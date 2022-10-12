export { AuthoredProps } from "./authored.props";
export { ReadProps } from "./read.props";
export { UpVotesProps } from "./upVotes.props";
export { DownVotesProps } from "./downVotes.props";
export { FavoritesProps } from "./favorites.props";

export enum UserToPostRelTypes {
	AUTHORED = "AUTHORED",
	FAVORITES = "FAVORITES",
	DOWN_VOTES = "DOWN_VOTES",
	UPVOTES = "UPVOTES",
	READ = "READ",
}