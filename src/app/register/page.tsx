"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./register.module.css";


const title_OPTIONS = ["นาย", "นาง", "นางสาว"] as const;


const sex_OPTIONS = [
  { value: "M", label: "ชาย" },
  { value: "F", label: "หญิง" },
] as const;

export default function RegisterPage() {
  const initialState = {
    title: "",
    fname: "",
    lname: "",
    identification_number: "",
    phone_number: "",
    birth_date: "",
    email: "",
    sex: "",
    role: "patient",
    password: "",
    confirmPassword: "",
  };

  const [form, set_form] = useState(initialState);
  const [message, set_message] = useState<string | null>(null);
  const [messageType, set_message_type] = useState<"error" | "success">("error");


  const handle_change = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;


    if (name === "identification_number" || name === "phone_number") {
      const onlyNums = value.replace(/\D/g, "");
      set_form((current) => ({ ...current, [name]: onlyNums }));
    } else {
      set_form((current) => ({ ...current, [name]: value }));
    }

    if (message) set_message(null);
  };

  const handle_submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();


    if (form.password !== form.confirmPassword) {
      set_message("รหัสผ่านไม่ตรงกัน");
      set_message_type("error");
      return;
    }

    const is_valid =
      form.title &&
      form.fname &&
      form.lname &&
      form.identification_number.length === 13 &&
      form.phone_number.length === 10 &&
      form.birth_date &&
      form.email &&
      form.sex &&
      form.password;

    if (!is_valid) {
      set_message("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง (เลขบัตร 13 หลัก / เบอร์โทร 10 หลัก)");
      set_message_type("error");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        set_message("สมัครสมาชิกสำเร็จ! 🎉");
        set_message_type("success");
        set_form(initialState);
      } else {
        set_message(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        set_message_type("error");
      }
    } catch (error) {
      console.error("Register error:", error);
      set_message("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      set_message_type("error");
    }
  };

  return (
    <main className={styles.container}>
      <div className={`${styles.circle} ${styles.circleTop}`}></div>
      <div className={`${styles.circle} ${styles.circleBottom}`}></div>
      <div className={styles.wrapper}>
        <div className={styles.leftcard}>
          <h1 className={styles.title}>สมัครสมาชิก</h1>
          <form className={styles.formGrid} onSubmit={handle_submit}>


            <div className={styles.field}>
              <label className={styles.label}>
                คำนำหน้า<span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                {title_OPTIONS.map((option) => (
                  <label key={option} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="title"
                      value={option}
                      checked={form.title === option}
                      onChange={handle_change}
                      className={styles.radioInput}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>


            <div className={styles.field}>
              <label className={styles.label}>
                เพศ<span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                {sex_OPTIONS.map((option) => (
                  <label key={option.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="sex"
                      value={option.value}
                      checked={form.sex === option.value}
                      onChange={handle_change}
                      className={styles.radioInput}
                      required
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>


            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="fname" className={styles.label}>ชื่อ*</label>
                <input
                  id="fname"
                  name="fname"
                  type="text"
                  value={form.fname}
                  onChange={handle_change}
                  className={styles.input}
                  placeholder="ชื่อ"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="lname" className={styles.label}>นามสกุล*</label>
                <input
                  id="lname"
                  name="lname"
                  type="text"
                  value={form.lname}
                  onChange={handle_change}
                  className={styles.input}
                  placeholder="นามสกุล"
                  required
                />
              </div>
            </div>


            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="identification_number" className={styles.label}>เลขบัตรประชาชน*</label>
                <input
                  id="identification_number"
                  name="identification_number"
                  type="text"
                  maxLength={13}
                  value={form.identification_number}
                  onChange={handle_change}
                  className={styles.input}
                  placeholder="รหัสบัตร 13 หลัก"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="phone_number" className={styles.label}>เบอร์โทรศัพท์*</label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="text"
                  maxLength={10}
                  value={form.phone_number}
                  onChange={handle_change}
                  className={styles.input}
                  placeholder="เบอร์โทรศัพท์ 10 หลัก"
                  required
                />
              </div>
            </div>

            {/* วันเกิด และ อีเมล */}
            <div className={styles.field}>
              <label htmlFor="birth_date" className={styles.label}>วัน/เดือน/ปีเกิด*</label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                value={form.birth_date}
                onChange={handle_change}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>อีเมล*</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handle_change}
                className={styles.input}
                placeholder="example@mail.com"
                required
              />
            </div>


            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>รหัสผ่าน*</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handle_change}
                className={styles.input}
                placeholder="รหัสผ่าน"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>ยืนยันรหัสผ่าน*</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handle_change}
                className={styles.input}
                placeholder="ยืนยันรหัสผ่าน"
                required
              />
            </div>


            {message && (
              <div className={`${styles.message} ${messageType === "error" ? styles.messageError : styles.messageSuccess}`}>
                {message}
              </div>
            )}

            <button type="submit" className={styles.submitButton}>
              ยืนยันการสร้างบัญชี
            </button>

            <div className={styles.footer}>
              มีบัญชีอยู่แล้ว? <Link href="/login" className={styles.link}>เข้าสู่ระบบ</Link>
            </div>
          </form>
        </div>

        <div className={styles.rightcard}>
          <img
            src="https://img5.pic.in.th/file/secure-sv1/healthcare-1.png"
            alt="healthcare hero"
            className={styles.picture}
          />
          <h1 className={styles.heroText}>สุขภาพนัดได้</h1>
        </div>
      </div>
    </main>
  );
}