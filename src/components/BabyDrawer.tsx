"use client";

import { useState } from "react";
import { Alert, Button, DatePicker, Drawer, Form, Input, InputNumber } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { BabyProfile } from "@/lib/baby";
import { saveProfile } from "@/lib/profile";

interface Values {
  name: string;
  birthday?: Dayjs | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

export function BabyDrawer({
  open,
  profile,
  onClose,
}: {
  open: boolean;
  profile: BabyProfile | null;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish(values: Values) {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        name: values.name.trim(),
        birthday: values.birthday ? values.birthday.format("YYYY-MM-DD") : null,
        weightKg: values.weightKg ?? null,
        heightCm: values.heightCm ?? null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      size={500}
      title={<span className="font-hand text-3xl font-bold">Baby details</span>}
      destroyOnHidden
    >
      <Form<Values>
        layout="vertical"
        requiredMark={false}
        disabled={saving}
        onFinish={handleFinish}
        initialValues={{
          name: profile?.name ?? "",
          birthday: profile?.birthday ? dayjs(profile.birthday) : null,
          weightKg: profile?.weightKg ?? null,
          heightCm: profile?.heightCm ?? null,
        }}
        className="mx-auto max-w-lg"
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, max: 60 }]}>
          <Input size="large" autoComplete="off" />
        </Form.Item>
        <Form.Item name="birthday" label="Birthday">
          <DatePicker
            size="large"
            className="w-full"
            format="MMM D, YYYY"
            inputReadOnly
            disabledDate={(date) => date.isAfter(dayjs(), "day")}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="weightKg" label="Weight">
            <InputNumber size="large" className="w-full!" min={0} max={50} step={0.05} inputMode="decimal" suffix="kg" />
          </Form.Item>
          <Form.Item name="heightCm" label="Height">
            <InputNumber size="large" className="w-full!" min={0} max={150} step={0.5} inputMode="decimal" suffix="cm" />
          </Form.Item>
        </div>
        {error && <Alert type="error" title={error} showIcon className="mb-4" />}
        <Button type="primary" htmlType="submit" size="large" block loading={saving}>
          Save
        </Button>
      </Form>
    </Drawer>
  );
}
