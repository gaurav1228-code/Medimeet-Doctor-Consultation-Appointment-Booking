// app/Patient-dashboard/speciality/page.jsx
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SPECIALTIES } from '@/lib/specialities'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Specialities = () => {
  return (
    <div className='container mx-auto px-4 pt-30'>
      <Link href={'/Patient-dashboard'}>
        <Button
          variant="outline"
          size="sm"
          className="mb-2 border-emerald-900/30"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>
      
        <div className='max-w-6xl mx-auto'>
            <div className='flex flex-col justify-center items-center mb-8 text-center'>
                <h1 className='text-3xl md:text-4xl font-extrabold gradient-title mb-2'>Find Your Doctor</h1>
                <p className='text-muted-foreground text-lg'>Browse by speciality or view all available healthcare providers</p>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {SPECIALTIES.map((specialty) => (
                <Link 
                  key={specialty.name} 
                  href={`/Patient-dashboard/speciality/${encodeURIComponent(specialty.name)}`}
                >
                  <Card className="hover:border-emerald-700/40 transition-all cursor-pointer border-emerald-900/20 h-full">
                    <CardContent className="h-full p-6 flex flex-col justify-center items-center text-center">
                      <div className='w-12 h-12 mb-4 flex justify-center items-center bg-emerald-900/20 rounded-full'>
                        <div className="text-2xl">{specialty.icon}</div>
                      </div>
                      <h3 className='font-medium text-white'>{specialty.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
        </div>
    </div>
  )
}

export default Specialities