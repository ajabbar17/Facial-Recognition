import AttendanceTable from '../components/Attendance';

async function fetchAttendanceData() {
  const res = await fetch('http://localhost:8000/attendance');
  
  if (!res.ok) {
    throw new Error('Failed to fetch attendance data');
  }
  
  return res.json();
}

export default async function AttendancePage() {
  const data = await fetchAttendanceData();

  return (
    <div>
      <AttendanceTable data={data} />
    </div>
  );
}