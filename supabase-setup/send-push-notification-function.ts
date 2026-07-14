// Deno / Supabase Edge Function: send-push-notification
// Serves as the webhook handler for table inserts on 'asistencias'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the payload sent by the database trigger
    const payload = await req.json()
    console.log('Webhook payload received:', payload)

    // The payload.record contains the newly inserted row in 'asistencias'
    const record = payload.record
    if (!record) {
      return new Response(JSON.stringify({ error: 'No record found in payload' }), { status: 400 })
    }

    const { id_usuario, fecha, hora_entrada, estado_entrada } = record

    // 1. Fetch student information
    const { data: student, error: errSt } = await supabaseClient
      .from('usuarios')
      .select('nombres, apellidos')
      .eq('id_usuario', id_usuario)
      .single()

    if (errSt || !student) {
      throw new Error(`Student not found: ${errSt?.message}`)
    }

    const studentName = `${student.nombres} ${student.apellidos}`

    // 2. Fetch the student's parent/apoderado push token
    // First, find the relation in 'parentescos'
    const { data: parentRelations } = await supabaseClient
      .from('parentescos')
      .select('id_apoderado')
      .eq('id_estudiante', id_usuario)

    const parentIds = parentRelations?.map(pr => pr.id_apoderado) || []
    
    // We also want to include the student's own token (if they logged in on their phone)
    const targetUserIds = [id_usuario, ...parentIds]

    // Fetch the push tokens of the targets
    const { data: users, error: errTokens } = await supabaseClient
      .from('usuarios')
      .select('id_usuario, push_token')
      .in('id_usuario', targetUserIds)

    if (errTokens) {
      throw new Error(`Error fetching tokens: ${errTokens.message}`)
    }

    const tokens = users
      ?.map(u => u.push_token)
      .filter(t => t && t.startsWith('ExponentPushToken')) || []

    if (tokens.length === 0) {
      console.log('No registered push tokens found for targets.')
      return new Response(JSON.stringify({ message: 'No tokens registered' }), { status: 200 })
    }

    // 3. Compose notification message
    const title = '🔔 Control de Asistencia'
    const body = `El estudiante ${studentName} registró su ingreso (${estado_entrada}) a las ${hora_entrada.substring(0, 5)} el ${fecha}.`

    // 4. Send pushes via Expo Push API
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { id_asistencia: record.id_asistencia },
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    console.log('Expo API Response:', result)

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error executing function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
