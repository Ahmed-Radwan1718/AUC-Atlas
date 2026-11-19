type PreviewProfessor = {
  name: string;
  course: string;
  rating: string;
  reviews: number;
};

const recommended: PreviewProfessor[] = [
  { name: "Professor A", course: "MENG 3601", rating: "4.8", reviews: 43 },
  { name: "Professor B", course: "MENG 3209", rating: "4.6", reviews: 29 },
];

const cautioned: PreviewProfessor[] = [
  { name: "Professor C", course: "MENG 3601", rating: "1.9", reviews: 31 },
  { name: "Professor D", course: "MENG 3506", rating: "2.3", reviews: 26 },
];

function PersonPlaceholder() {
  return (
    <div className="homepagenew-professor-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-4 3.1-6 7-6s7 2 7 6" />
      </svg>
    </div>
  );
}

function Rating({ professor }: { professor: PreviewProfessor }) {
  return (
    <div className="homepagenew-professor-rating">
      <div className="homepagenew-professor-rating-score">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="m12 2.5 2.9 5.88 6.5.95-4.7 4.57 1.11 6.48L12 17.32l-5.81 3.06 1.11-6.48-4.7-4.57 6.5-.95L12 2.5Z" />
        </svg>
        <strong>{professor.rating}</strong>
      </div>
      <span>{professor.reviews} reviews</span>
    </div>
  );
}

function ProfessorGroup({ label, tone, professors }: {
  label: string; tone: "consider" | "avoid"; professors: PreviewProfessor[];
}) {
  return (
    <div className="homepagenew-professor-panel">
      <h3 className="homepagenew-professor-panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {tone === "consider" ? (
            <>
              <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" />
              <path d="m7 10 4.7-7.2a2 2 0 0 1 3.5 1.7L14.5 8H20a2 2 0 0 1 1.96 2.4l-1.6 8A2 2 0 0 1 18.4 20H7" />
            </>
          ) : (
            <>
              <path d="M7 14V4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3Z" />
              <path d="m7 14 4.7 7.2a2 2 0 0 0 3.5-1.7l-.7-3.5H20a2 2 0 0 0 1.96-2.4l-1.6-8A2 2 0 0 0 18.4 4H7" />
            </>
          )}
        </svg>
        {label}
      </h3>
      <div className="homepagenew-professor-list">
        {professors.map(professor => (
          <div className="homepagenew-professor-item" key={professor.name}>
            <PersonPlaceholder />
            <div className="homepagenew-professor-identity">
              <strong>{professor.name}</strong>
              <span>{professor.course}</span>
            </div>
            <Rating professor={professor} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NextSemesterProfessorsPreview() {
  return (
    <section className="homepagenew-professors" aria-labelledby="homepagenew-professors-title">
      <div className="homepagenew-professors-heading">
        <h2 id="homepagenew-professors-title">Professors for Next Semester</h2>
        <span>Spring 2027 · Layout preview</span>
      </div>
      <div className="homepagenew-professor-grid">
        <ProfessorGroup label="Professors to Consider" tone="consider" professors={recommended} />
        <ProfessorGroup label="Professors to Avoid" tone="avoid" professors={cautioned} />
      </div>
    </section>
  );
}
