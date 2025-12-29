import BookDetailsPage from "../../../component/BookDetailsPage";

export default function BookPage({ params }) {
  const { id } = params; // dynamic route param
  return <BookDetailsPage bookId={parseInt(id)} />; // pass as prop
}
