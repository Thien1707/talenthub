import styles from "./how-it-works-steps.module.css";

const APPLICATION_STEPS = [
  {
    title: "Chọn tin việc làm",
    text: "Duyệt danh sách công khai, mở chi tiết tin và chọn CV bạn muốn gửi.",
  },
  {
    title: "Nộp hồ sơ",
    text: "Xem gợi ý AI về độ phù hợp rồi bấm nộp — mỗi lần ứng tuyển gắn với một CV.",
  },
  {
    title: "Theo dõi tại đây",
    text: "Mọi đơn hiện ở mục bên dưới: trạng thái, xem lại tin và nhắn tin với nhà tuyển dụng.",
  },
] as const;

export function ApplicationsHowItWorks() {
  return (
    <section className={styles.section} aria-labelledby="applications-how-it-works">
      <p className={styles.hand}>cách hoạt động</p>
      <h2 id="applications-how-it-works" className={styles.heading}>
        Tìm việc trước, quản lý đơn tại đây
      </h2>
      <ol className={styles.steps}>
        {APPLICATION_STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <h3 className={styles.stepTitle}>
              <span className="sr-only">Bước {index + 1}: </span>
              {step.title}
            </h3>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
