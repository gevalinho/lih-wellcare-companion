import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { BookOpen, Heart, Apple, Activity, Brain, Moon, Droplets } from 'lucide-react';

export function HealthTips() {
  const tips = [
    {
      category: 'Hypertension Management',
      icon: Heart,
      color: 'red',
      items: [
        {
          title: 'Monitor Regularly',
          description: 'Check your blood pressure at the same time each day for consistent readings.',
        },
        {
          title: 'Reduce Sodium Intake',
          description: 'Limit sodium to less than 2,300mg per day. Read food labels carefully.',
        },
        {
          title: 'Manage Stress',
          description: 'Practice relaxation techniques like deep breathing, meditation, or yoga.',
        },
        {
          title: 'Limit Alcohol',
          description: 'If you drink alcohol, do so in moderation - no more than 1-2 drinks per day.',
        },
      ],
    },
    {
      category: 'Nutrition & Diet',
      icon: Apple,
      color: 'green',
      items: [
        {
          title: 'DASH Diet',
          description: 'Follow the DASH (Dietary Approaches to Stop Hypertension) eating plan rich in fruits, vegetables, and low-fat dairy.',
        },
        {
          title: 'Increase Potassium',
          description: 'Eat foods high in potassium like bananas, oranges, and spinach to help lower blood pressure.',
        },
        {
          title: 'Whole Grains',
          description: 'Choose whole grains over refined grains for better heart health.',
        },
        {
          title: 'Healthy Fats',
          description: 'Include omega-3 fatty acids from fish, nuts, and olive oil in your diet.',
        },
      ],
    },
    {
      category: 'Physical Activity',
      icon: Activity,
      color: 'blue',
      items: [
        {
          title: 'Regular Exercise',
          description: 'Aim for at least 150 minutes of moderate aerobic activity or 75 minutes of vigorous activity per week.',
        },
        {
          title: 'Start Slowly',
          description: 'If you\'re new to exercise, start with just 10-15 minutes a day and gradually increase.',
        },
        {
          title: 'Stay Consistent',
          description: 'Make exercise a daily habit. Even a short walk can make a difference.',
        },
        {
          title: 'Find Activities You Enjoy',
          description: 'Choose activities you like - walking, swimming, cycling, dancing, or gardening.',
        },
      ],
    },
    {
      category: 'Medication Adherence',
      icon: Heart,
      color: 'purple',
      items: [
        {
          title: 'Set Reminders',
          description: 'Use phone alarms or medication reminder apps to never miss a dose.',
        },
        {
          title: 'Organize Your Medications',
          description: 'Use a pill organizer to sort your medications by day and time.',
        },
        {
          title: 'Understand Your Medications',
          description: 'Know what each medication does and potential side effects. Ask your doctor if unsure.',
        },
        {
          title: 'Never Stop Suddenly',
          description: 'Don\'t stop taking medications without consulting your doctor, even if you feel better.',
        },
      ],
    },
    {
      category: 'Sleep & Recovery',
      icon: Moon,
      color: 'indigo',
      items: [
        {
          title: 'Get Enough Sleep',
          description: 'Aim for 7-9 hours of quality sleep each night. Poor sleep can raise blood pressure.',
        },
        {
          title: 'Maintain Sleep Schedule',
          description: 'Go to bed and wake up at the same time every day, even on weekends.',
        },
        {
          title: 'Create a Sleep-Friendly Environment',
          description: 'Keep your bedroom dark, quiet, and cool for better sleep quality.',
        },
        {
          title: 'Limit Screen Time',
          description: 'Avoid screens at least 1 hour before bedtime to improve sleep quality.',
        },
      ],
    },
    {
      category: 'Hydration',
      icon: Droplets,
      color: 'cyan',
      items: [
        {
          title: 'Drink Plenty of Water',
          description: 'Aim for 8 glasses of water per day. Proper hydration supports overall health.',
        },
        {
          title: 'Limit Caffeine',
          description: 'Too much caffeine can temporarily raise blood pressure. Limit to 1-2 cups of coffee per day.',
        },
        {
          title: 'Reduce Sugary Drinks',
          description: 'Avoid sodas and sweetened beverages. They contribute to weight gain and health issues.',
        },
      ],
    },
    {
      category: 'Mental Wellness',
      icon: Brain,
      color: 'pink',
      items: [
        {
          title: 'Manage Stress',
          description: 'Chronic stress can raise blood pressure. Find healthy ways to cope with stress.',
        },
        {
          title: 'Practice Mindfulness',
          description: 'Regular meditation or mindfulness practices can help lower blood pressure.',
        },
        {
          title: 'Stay Connected',
          description: 'Maintain social connections. Loneliness and isolation can affect your health.',
        },
        {
          title: 'Seek Support',
          description: 'Don\'t hesitate to talk to a mental health professional if you\'re feeling overwhelmed.',
        },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
    };
    return classes[color as keyof typeof classes] || classes.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">Health Tips & Education</h2>
        <p className="text-gray-600">Learn how to maintain a healthy lifestyle</p>
      </div>

      {/* Tips Categories */}
      <div className="space-y-6">
        {tips.map((category) => {
          const Icon = category.icon;
          const colors = getColorClasses(category.color);
          
          return (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`${colors.bg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item, index) => (
                    <div key={index} className={`p-4 border-2 ${colors.border} rounded-lg hover:shadow-md transition-shadow`}>
                      <div className="font-medium mb-2">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Contact Info */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">When to Seek Emergency Care</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-900 space-y-2">
          <p className="font-medium">Call emergency services immediately if you experience:</p>
          <ul className="space-y-1 ml-4">
            <li>• Blood pressure above 180/120 with symptoms (severe headache, chest pain, shortness of breath)</li>
            <li>• Chest pain or pressure</li>
            <li>• Sudden severe headache</li>
            <li>• Difficulty breathing</li>
            <li>• Vision problems</li>
            <li>• Confusion or difficulty speaking</li>
            <li>• Severe anxiety</li>
          </ul>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Disclaimer:</strong> The information provided here is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with your healthcare provider before making any changes to your health regimen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
