export { AuthoredProps } from "./authored.props";
export { ReadProps } from "./read.props";
export { VoteProps } from "./vote.props";
export { FavoritesProps } from "./favorites.props";
export { ReportedProps } from "./reported.props";

export enum UserToPostRelTypes {
    AUTHORED = "AUTHORED",
    FAVORITES = "FAVORITES",
    DOWN_VOTES = "DOWN_VOTES",
    UPVOTES = "UPVOTES",
    READ = "READ",
    REPORTED = "REPORTED",
}
