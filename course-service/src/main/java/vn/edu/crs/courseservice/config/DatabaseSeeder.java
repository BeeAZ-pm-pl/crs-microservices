package vn.edu.crs.courseservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vn.edu.crs.courseservice.entity.Course;
import vn.edu.crs.courseservice.repository.CourseRepository;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final CourseRepository courseRepository;

    public DatabaseSeeder(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (courseRepository.count() == 0) {
            Course course1 = new Course(null, "Lap trinh Java co ban", 3, 40, 12);
            Course course2 = new Course(null, "Co so du lieu", 4, 35, 0);
            courseRepository.saveAll(List.of(course1, course2));
        }
    }
}
