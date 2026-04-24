import ChatDashboard from "../../component/ChatDashboard";

export default function MessagesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with other users</p>
      </div>
      <ChatDashboard />
    </div>
  );
}
