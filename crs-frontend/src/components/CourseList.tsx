import type { Course } from '../types/course';
import type { LoadState } from '../api/useCourses';

interface CourseListProps {
  courses: Course[];
  state: LoadState;
  errorMessage: string;
  onRetry: () => void;
}

export default function CourseList({
  courses,
  state,
  errorMessage,
  onRetry,
}: CourseListProps) {
  if (state === 'loading') {
    return <p>Đang tải danh sách môn học...</p>;
  }

  if (state === 'error') {
    return (
      <div style={{ color: '#b91c1c' }}>
        <p>{errorMessage}</p>
        <button onClick={onRetry}>Thử lại</button>
      </div>
    );
  }

  if (state === 'empty') {
    return <p>Không tìm thấy môn học nào phù hợp.</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
          <th>Tên môn học</th>
          <th>Số tín chỉ</th>
          <th>Số chỗ còn lại</th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => (
          <tr key={course.id} style={{ borderBottom: '1px solid #eee' }}>
            <td>{course.tenMonHoc}</td>
            <td>{course.soTinChi}</td>
            <td
              style={{
                color: course.soChoConLai === 0 ? '#b91c1c' : 'inherit',
              }}
            >
              {course.soChoConLai} / {course.soChoToiDa}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
