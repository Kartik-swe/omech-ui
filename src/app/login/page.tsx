"use client";
import Cookies from "js-cookie"; // Import js-cookie
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, message, Card } from "antd";
import DeviceAccessPanel from "../components/DeviceAccessPanel";
import { DeviceStatusInfo, deviceHeaders, fetchDeviceStatus } from "@/utils/device";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
// state for handle Error msg
  const [errMsg, setErrMsg] = useState('');

  // Device registration. Nothing is called on page load: the device screen is
  // shown ONLY after a login attempt is refused with "Access denied" (outside
  // the allowed IPs and not an approved device). Office PCs never see it.
  const [deviceGate, setDeviceGate] = useState<DeviceStatusInfo | null>(null);
  const [lastUsername, setLastUsername] = useState("");

  const checkDevice = async () => {
    const st = await fetchDeviceStatus();
    const gate = st && !st.IP_ALLOWED && st.DEVICE_STATUS !== "APPROVED" ? st : null;
    setDeviceGate(gate);
    return { st, gate };
  };


  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...deviceHeaders(), // registered phones only
        },
        body: JSON.stringify(values),
      });

      // Refused by the IP / device check (plain-text reply, not JSON)
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        if (text.startsWith("Access denied")) {
          setLastUsername(values.username);
          const { st, gate } = await checkDevice();
          if (!gate) {
            const msg = st?.DEVICE_STATUS === "APPROVED"
              ? "This device was just approved. Please try again in a minute."
              : "Access denied from this network. Please contact your admin.";
            setErrMsg(msg);
            message.error(msg);
          }
          return;
        }
        throw new Error(text);
      }

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

  if (deviceGate) {
    return (
      <div
        className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-100 px-4"
        style={{ zIndex: 9999 }}
      >
        <DeviceAccessPanel
          status={deviceGate}
          initialUsername={lastUsername}
          onRecheck={async () => { await checkDevice(); }}
          onBack={() => setDeviceGate(null)}
        />
      </div>
    );
  }

  return (
    <div
    className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-100 px-4"
    style={{ zIndex: 9999 }}
  >
      <Card title="Login" className="w-full max-w-sm shadow-lg rounded-lg">
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
