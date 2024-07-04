import React, { useState } from 'react';

const Chatroom = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput('');
    }
  };

  return (
    <div className="w-full md:col-span-4">
      <h2 className="mb-4 text-xl md:text-2xl">References and Notes</h2>
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-white p-4 md:gap-4">
          <div className="col-span-12">
            <div className="max-h-80 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 rounded bg-gray-200 text-gray-700"
                >
                  {message}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center pt-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 p-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
