"use client";
import Cookies from "js-cookie"; // Import js-cookie
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, message, Card } from "antd";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
// state for handle Error msg
  const [errMsg, setErrMsg] = useState('');


  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        const expMin = Number(process.env.NEXT_PUBLIC_AUTH_EXPIRY_TIME || 30)
        const expirationTime = new Date(new Date().getTime() + expMin * 60 * 1000);

        Cookies.set("token", data.token, { expires: expirationTime, secure: true, sameSite: "strict" });
        Cookies.set("user", JSON.stringify(data.user), { expires: expirationTime, secure: true, sameSite: "strict" });


        message.success("Login successful!");
        window.location.href = "/materials"; // Redirect to dashboard
        // router.push("/materials"); // Redirect to dashboard
      } else {
        setErrMsg(data.message || "Invalid credentials");
        message.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      setErrMsg("Something went wrong. Please try again.");
      message.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
    className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-100"
    style={{ zIndex: 9999 }}
  >
      <Card title="Login" className="w-96 shadow-lg rounded-lg">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter your username" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
        {/* Handle Error Msg */}
        {errMsg && <div className="text-red-500 text-sm">{errMsg}</div>}
      </Card>
    </div>
  );
};

export default LoginPage;
