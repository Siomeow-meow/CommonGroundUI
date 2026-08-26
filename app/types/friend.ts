export default interface Friend {
  id: number;
  createdAt: Date;
  status: string;
  otherUser: {
    id: string;
    userName: string;
    profileImg: string;
  };
}
