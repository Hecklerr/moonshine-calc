import React, { useState } from 'react';
import { Form, Field } from 'react-final-form';
import { InputNumber, Checkbox, Select, Card, Space, Button, Alert, Typography } from 'antd';
import { Droplets, Beaker, Percent, X } from 'lucide-react';
import { evaluate } from 'mathjs';

const { Option } = Select;
const { Text } = Typography;

const MAIN_FIELDS = [
  { name: 'startVolume', label: 'Начальный объем', unit: 'л', icon: <Beaker size={16} />, max: 1000 },
  { name: 'startStrength', label: 'Начальная крепость', unit: '%', icon: <Percent size={16} />, max: 100 },
  { name: 'targetVolume', label: 'Конечный объем', unit: 'л', icon: <Beaker size={16} />, max: 1000 },
  { name: 'targetStrength', label: 'Конечная крепость', unit: '%', icon: <Percent size={16} />, max: 100 },
];

const MoonshineForm = () => {
  const [isCalculated, setIsCalculated] = useState(false);
  const [results, setResults] = useState(null);

    const calculate = (values, form) => {
    const v1 = Number(values.startVolume);
    const c1 = Number(values.startStrength);
    const v2 = Number(values.targetVolume);
    const c2 = Number(values.targetStrength);

    console.log(c1, c2)

    if (c1 && c2 && c1 < c2) {
        alert("Ошибка: Целевая крепость не может быть выше исходной!");
        return;
    }
    
    let computedValue = 0;
    let computedField = '';

    if (!values.startVolume) {
        computedField = 'startVolume';
        computedValue = evaluate(`(${v2} * ${c2}) / ${c1}`);
    } else if (!values.startStrength) {
        computedField = 'startStrength';
        computedValue = evaluate(`(${v2} * ${c2}) / ${v1}`);
    } else if (!values.targetVolume) {
        computedField = 'targetVolume';
        computedValue = evaluate(`(${v1} * ${c1}) / ${c2}`);
    } else if (!values.targetStrength) {
        computedField = 'targetStrength';
        computedValue = evaluate(`(${v1} * ${c1}) / ${v1}`);
        computedValue = evaluate(`(${v1} * ${c1}) / ${v2}`);
    }

    if (computedField) {
        const finalVal = Number(computedValue.toFixed(2));
        form.change(computedField, finalVal);
        
        const currentV1 = computedField === 'startVolume' ? finalVal : v1;
        const currentC1 = computedField === 'startStrength' ? finalVal : c1;
        const currentV2 = computedField === 'targetVolume' ? finalVal : v2;

        const waterAdded = evaluate(`${currentV2} - ${currentV1}`);
        const pureAlcohol = evaluate(`(${currentV1} * ${currentC1}) / 100`);
        const headsVolume = values.headsEnabled 
        ? evaluate(`${pureAlcohol} * (${values.headsPercent} / 100)`) 
        : 0;

        setResults({ waterAdded, headsVolume, isHeads: values.headsEnabled });
        setIsCalculated(true);
    }
    };

  return (
    <Card 
      title={<span><Droplets style={{ marginRight: 8, color: '#1890ff' }} size={20} /> Смарт-калькулятор</span>}
      style={{ 
        maxWidth: 450, 
        margin: '40px auto', 
        borderColor: isCalculated ? '#52c41a' : '#d9d9d9',
        borderWidth: 2,
        transition: 'all 0.3s',
        boxShadow: isCalculated ? '0 0 10px rgba(82, 196, 26, 0.2)' : 'none'
      }}
    >
      <Form
        onSubmit={(vals, form) => calculate(vals, form)}
        initialValues={{ headsEnabled: false, headsPercent: 10 }}
        render={({ handleSubmit, values, form }) => {
          const filledFields = MAIN_FIELDS.filter(f => 
            values[f.name] !== undefined && values[f.name] !== null && values[f.name] !== ''
          );
          
          const canCalculate = filledFields.length === 3 && !isCalculated;

          const handleFieldChange = (name, val) => {
            if (isCalculated) setIsCalculated(false);
            form.change(name, val);
          };

          return (
            <form onSubmit={handleSubmit}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                
                {MAIN_FIELDS.map(f => (
                  <div key={f.name}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{f.label}</Text>
                    <Field name={f.name}>
                    {({ input }) => {
                        const hasValue = input.value !== undefined && input.value !== null && input.value !== '';
                        
                        return (
                        <InputNumber 
                            value={input.value}
                            onChange={(v) => {
                                const cappedValue = f.max && v > f.max ? f.max : v;
                                input.onChange(cappedValue);
                                handleFieldChange(f.name, cappedValue);
                            }}
                            controls={true}
                            className="stable-input"
                            onBlur={() => input.onBlur()}
                            onFocus={() => input.onFocus()}
                            placeholder="0.00"
                            style={{ width: '100%' }} 
                            min={0}
                            max={f.max}
                            precision={2}
                            prefix={f.icon} 
                            suffix={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {hasValue && (
                                <X 
                                    size={14} 
                                    style={{ 
                                    cursor: 'pointer', 
                                    color: '#bfbfbf',
                                    transition: 'color 0.2s',
                                    pointerEvents: 'auto'
                                    }}
                                    onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    input.onChange(null);
                                    handleFieldChange(f.name, null);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4f'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#bfbfbf'}
                                />
                                )}
                                <Text type="secondary" style={{ fontSize: '12px', borderLeft: '1px solid #f0f0f0', paddingLeft: '6px' }}>
                                {f.unit}
                                </Text>
                            </div>
                            }
                        />
                        );
                    }}
                    </Field>
                  </div>
                ))}

                <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                  <Field name="headsEnabled" type="checkbox">
                    {({ input }) => (
                      <Checkbox 
                        {...input} 
                        onChange={e => { input.onChange(e); setIsCalculated(false); }}
                      >
                        Рассчитать головную фракцию
                      </Checkbox>
                    )}
                  </Field>

                  {values.headsEnabled && (
                    <div style={{ marginTop: 10 }}>
                      <Field name="headsPercent">
                        {({ input }) => (
                          <Select 
                            {...input} 
                            style={{ width: '100%' }} 
                            onChange={v => { input.onChange(v); setIsCalculated(false); }}
                          >
                            {[8, 10, 12, 15].map(p => (
                              <Option key={p} value={p}>{p}% от абсолютного спирта</Option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </div>
                  )}
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  size="large"
                  disabled={!canCalculate}
                >
                  {isCalculated ? 'Готово' : 'Рассчитать'}
                </Button>

                {isCalculated && results && (
                  <Alert
                    type="success"
                    showIcon
                    message="Результаты:"
                    description={
                      <div style={{ marginTop: 5 }}>
                        <div style={{ marginBottom: 4 }}>
                          💧 Добавить воды: <b>{results.waterAdded > 0 ? results.waterAdded.toFixed(3) : 0} л</b>
                        </div>
                        {results.isHeads && (
                          <div>
                            ✂️ Отобрать голов: <b>{(results.headsVolume * 1000).toFixed(0)} мл</b>
                          </div>
                        )}
                      </div>
                    }
                  />
                )}
              </Space>
            </form>
          );
        }}
      />
    </Card>
  );
};

export default MoonshineForm;
