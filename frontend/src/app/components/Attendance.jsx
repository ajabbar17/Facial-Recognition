import React from "react";



const AttendanceTable = ({data}) => {
return (
    <div className="min-h-screen bg-white px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Attendance Records
        </h1>
        <div className="max-w-5xl mx-auto overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-white border pb-10 border-gray-200 text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3 border-b">Name</th>
                        <th className="px-6 py-3 border-b">Age</th>
                        <th className="px-6 py-3 border-b">Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((entry, index) => (
                        <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors duration-200"
                        >
                            <td className="px-6 py-4 border-b font-medium text-gray-800">
                                {entry.name}
                            </td>
                            <td className="px-6 py-4 border-b text-gray-600">
                                {entry.age}
                            </td>
                            <td className="px-6 py-4 border-b text-gray-600">
                                {new Date(entry.created_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
};

export default AttendanceTable;
